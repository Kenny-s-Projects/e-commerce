-- kclick · Fonctions : rôles, cycle de vie des commandes, commande partielle, notifications, vue super-admin

/* ---------- Utilitaires ---------- */
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger order_parts_updated_at before update on public.order_parts for each row execute function public.set_updated_at();

-- Onglet dashboard d'un statut : En attente · En cours · Refusées · Terminées
create or replace function public.order_tab(s public.order_status) returns text
language sql immutable set search_path = '' as $$
  select case
    when s = 'en_attente' then 'En attente'
    when s in ('en_cours', 'prete_retrait', 'en_livraison') then 'En cours'
    when s in ('refusee', 'annulee') then 'Refusées'
    else 'Terminées'
  end
$$;

/* ---------- Nouveau compte : profil + rôle client ---------- */
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', coalesce(new.phone, new.raw_user_meta_data ->> 'phone'));
  insert into public.user_roles (user_id, role) values (new.id, 'client');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

/* ---------- Rôles (security definer : évite la récursion des règles d'accès) ---------- */
create or replace function public.has_role(r public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = r)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_role('super_admin')
$$;

create or replace function public.is_brand_employee(b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'employe' and brand_id = b)
$$;

create or replace function public.is_order_customer(o uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.orders where id = o and customer_id = (select auth.uid()))
$$;

create or replace function public.is_order_rider(o uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.deliveries d join public.riders r on r.id = d.rider_id
    where d.order_id = o and r.profile_id = (select auth.uid())
  )
$$;

create or replace function public.is_order_employee(o uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.order_parts p
    join public.user_roles ur on ur.brand_id = p.brand_id and ur.role = 'employe' and ur.user_id = (select auth.uid())
    where p.order_id = o
  )
$$;

create or replace function public.can_see_order(o uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or public.is_order_customer(o) or public.is_order_employee(o) or public.is_order_rider(o)
$$;

-- Une part : le client et le livreur voient tout ; un employé seulement la part de sa brand
create or replace function public.can_see_part(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.order_parts p
    where p.id = p_id
      and (public.is_admin() or public.is_brand_employee(p.brand_id)
           or public.is_order_customer(p.order_id) or public.is_order_rider(p.order_id))
  )
$$;

/* ---------- Statut global calculé à partir des parts ---------- */
create or replace function public.refresh_order(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  n_active int; n_refused int; n_pending int; n_collected int;
  active_amount numeric;
  new_status public.order_status;
begin
  select * into o from public.orders where id = p_order for update;

  select count(*) filter (where status not in ('refusee', 'annulee')),
         count(*) filter (where status = 'refusee'),
         count(*) filter (where status = 'en_attente'),
         count(*) filter (where status = 'collectee'),
         coalesce(sum(amount_due) filter (where status not in ('refusee', 'annulee')), 0)
    into n_active, n_refused, n_pending, n_collected, active_amount
  from public.order_parts where order_id = p_order;

  new_status := o.status;
  if n_active = 0 then
    new_status := case when n_refused > 0 then 'refusee' else 'annulee' end::public.order_status;
  elsif o.status in ('en_attente', 'en_cours') then
    if n_pending = n_active then
      new_status := 'en_attente';
    elsif o.mode = 'livraison' and n_collected = n_active then
      new_status := 'en_livraison'; -- le livreur a récupéré toutes les parts
    else
      new_status := 'en_cours';
    end if;
  end if;

  update public.orders set
    status = new_status,
    is_partial = (n_refused > 0 and n_active > 0),
    adjusted_total = case when n_active = 0 then 0 else active_amount + delivery_fee end
  where id = p_order;

  if new_status is distinct from o.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (p_order, o.status, new_status, (select auth.uid()));
  end if;
end $$;

-- Remet en stock les articles d'une part
create or replace function public.restore_part_stock(p_part uuid) returns void
language sql security definer set search_path = '' as $$
  update public.product_variants v set stock = v.stock + i.qty
  from (select variant_id, sum(quantity) as qty from public.order_items
        where order_part_id = p_part and variant_id is not null group by variant_id) i
  where v.id = i.variant_id
$$;

-- Part refusée : stock, remboursement si déjà payé, message au client
create or replace function public.handle_part_refused(p_part uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  p public.order_parts; o public.orders; b public.brands;
  items text; paid numeric; msg text;
begin
  select * into p from public.order_parts where id = p_part;
  select * into o from public.orders where id = p.order_id;
  select * into b from public.brands where id = p.brand_id;

  perform public.restore_part_stock(p_part);

  select coalesce(sum(amount) filter (where kind = 'paiement' and status = 'paye'), 0)
       - coalesce(sum(amount) filter (where kind = 'remboursement' and status <> 'annule'), 0)
    into paid from public.payments where order_id = o.id;
  if paid > 0 then
    insert into public.payments (order_id, order_part_id, kind, method, amount, status)
    values (o.id, p.id, 'remboursement', o.payment_method, least(paid, p.amount_due), 'en_attente');
  end if;

  select string_agg(product_name || coalesce(' (' || variant_label || ')', ''), ', ') into items
  from public.order_items where order_part_id = p_part;

  if o.status = 'refusee' then
    msg := b.name || ' n''a pas pu préparer votre commande (' || p_reason || '). Votre commande est refusée'
           || case when paid > 0 then ' et vous serez remboursé.' else '.' end;
  else
    msg := b.name || ' n''a pas pu préparer : ' || items || ' (' || p_reason || '). '
           || 'Votre commande continue ; nouveau total : ' || o.adjusted_total || ' $.'
           || case when paid > 0 then ' La différence vous sera remboursée.' else '' end
           || ' Vous pouvez encore annuler toute la commande avant son départ en livraison.';
  end if;

  insert into public.notifications (profile_id, recipient_phone, order_id, channel, title, body)
  values (o.customer_id, case when o.customer_id is null then o.customer_phone end, o.id,
          case when o.customer_id is null then 'whatsapp' else 'app' end::public.notif_channel,
          'Commande ' || o.number || ' modifiée', msg);
end $$;

/* ---------- Passer une commande (client connecté ou sans compte) ----------
   payload : { customer: {name, phone, email}, mode: 'livraison'|'retrait',
               address: {commune, quartier, street, landmark}, payment_method, payer_phone, provider,
               note, items: [{variant_id, quantity, gift_message}] }
   Les prix et le stock viennent toujours de la base, jamais du navigateur. */
create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  it jsonb; v public.product_variants; prod public.products;
  v_order uuid; v_number text; v_part uuid; v_qty int;
  v_sub numeric := 0; v_fee numeric; v_mode public.delivery_mode; v_pickup uuid;
begin
  if coalesce(jsonb_array_length(payload -> 'items'), 0) = 0 then raise exception 'Panier vide'; end if;
  if coalesce(trim(payload #>> '{customer,name}'), '') = '' or coalesce(trim(payload #>> '{customer,phone}'), '') = '' then
    raise exception 'Nom et téléphone obligatoires';
  end if;

  v_mode := (payload ->> 'mode')::public.delivery_mode;
  v_fee := case when v_mode = 'livraison' then 4 else 0 end; -- Gombe, le jour même (autres communes à définir)
  if v_mode = 'retrait' then
    select id into v_pickup from public.brands where is_pickup_point order by created_at limit 1;
  elsif payload -> 'address' is null or coalesce(payload #>> '{address,commune}', '') = '' then
    raise exception 'Adresse de livraison obligatoire';
  end if;

  insert into public.orders (customer_id, customer_name, customer_phone, customer_email, mode, address_snapshot,
                             pickup_brand_id, payment_method, customer_note)
  values ((select auth.uid()), trim(payload #>> '{customer,name}'), trim(payload #>> '{customer,phone}'),
          nullif(trim(payload #>> '{customer,email}'), ''), v_mode,
          case when v_mode = 'livraison' then payload -> 'address' end, v_pickup,
          (payload ->> 'payment_method')::public.payment_method, nullif(trim(payload ->> 'note'), ''))
  returning id, number into v_order, v_number;

  for it in select * from jsonb_array_elements(payload -> 'items') loop
    v_qty := coalesce((it ->> 'quantity')::int, 0);
    if v_qty <= 0 then raise exception 'Quantité invalide'; end if;

    select * into v from public.product_variants where id = (it ->> 'variant_id')::uuid and is_active for update;
    if not found then raise exception 'Article indisponible'; end if;
    select * into prod from public.products where id = v.product_id and is_active;
    if not found then raise exception 'Article indisponible'; end if;
    if v.price is null then raise exception 'Prix à venir : %', prod.name_fr; end if;
    if v.stock < v_qty then raise exception 'Stock insuffisant : %', prod.name_fr; end if;

    update public.product_variants set stock = stock - v_qty where id = v.id;

    insert into public.order_parts (order_id, brand_id) values (v_order, prod.brand_id)
    on conflict (order_id, brand_id) do update set brand_id = excluded.brand_id
    returning id into v_part;

    insert into public.order_items (order_part_id, variant_id, product_name, variant_label, unit_price, quantity, gift_message)
    values (v_part, v.id, prod.name_fr, nullif(v.label, 'Standard'), v.price, v_qty, nullif(trim(it ->> 'gift_message'), ''));

    update public.order_parts set amount_due = amount_due + v.price * v_qty where id = v_part;
    v_sub := v_sub + v.price * v_qty;
  end loop;

  update public.orders set subtotal = v_sub, delivery_fee = v_fee, total = v_sub + v_fee, adjusted_total = v_sub + v_fee
  where id = v_order;

  insert into public.payments (order_id, method, provider, amount, payer_phone)
  values (v_order, (payload ->> 'payment_method')::public.payment_method, nullif(payload ->> 'provider', ''),
          v_sub + v_fee, nullif(payload ->> 'payer_phone', ''));

  insert into public.order_status_history (order_id, to_status, changed_by) values (v_order, 'en_attente', (select auth.uid()));

  -- Une notification par brand : tous ses employés la voient
  insert into public.notifications (brand_id, order_id, title, body)
  select p.brand_id, v_order, 'Nouvelle commande ' || v_number,
         (select count(*) from public.order_items i where i.order_part_id = p.id) || ' article(s) à préparer · ' || p.amount_due || ' $'
  from public.order_parts p where p.order_id = v_order;

  -- Confirmation au client
  insert into public.notifications (profile_id, recipient_phone, order_id, channel, title, body)
  values ((select auth.uid()), case when (select auth.uid()) is null then trim(payload #>> '{customer,phone}') end, v_order,
          case when (select auth.uid()) is null then 'whatsapp' else 'app' end::public.notif_channel,
          'Commande ' || v_number || ' reçue', 'Total : ' || (v_sub + v_fee) || ' $. Nous vous prévenons dès qu''elle est validée.');

  return jsonb_build_object('id', v_order, 'number', v_number, 'total', v_sub + v_fee);
end $$;

/* ---------- Employé (ou livreur pour la collecte) : faire avancer une part ---------- */
create or replace function public.set_part_status(p_part uuid, p_status public.part_status, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.order_parts; ok boolean;
begin
  select * into p from public.order_parts where id = p_part for update;
  if not found then raise exception 'Part introuvable'; end if;

  if not (public.is_admin() or public.is_brand_employee(p.brand_id)
          or (p_status = 'collectee' and public.is_order_rider(p.order_id))) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  ok := case p.status
    when 'en_attente'     then p_status in ('acceptee', 'refusee')
    when 'acceptee'       then p_status in ('en_preparation', 'refusee')
    when 'en_preparation' then p_status in ('prete', 'refusee')
    when 'prete'          then p_status = 'collectee'
    else false end;
  if not ok then raise exception 'Changement impossible : % → %', p.status, p_status; end if;
  if p_status = 'refusee' and coalesce(trim(p_reason), '') = '' then raise exception 'Motif de refus obligatoire'; end if;

  update public.order_parts set
    status = p_status,
    refusal_reason = case when p_status = 'refusee' then trim(p_reason) else refusal_reason end,
    accepted_at  = case when p_status = 'acceptee'  then now() else accepted_at end,
    ready_at     = case when p_status = 'prete'     then now() else ready_at end,
    collected_at = case when p_status = 'collectee' then now() else collected_at end,
    refused_at   = case when p_status = 'refusee'   then now() else refused_at end
  where id = p_part;

  insert into public.order_status_history (order_id, order_part_id, from_status, to_status, changed_by, reason)
  values (p.order_id, p.id, p.status, p_status, (select auth.uid()), nullif(trim(p_reason), ''));

  perform public.refresh_order(p.order_id);
  if p_status = 'refusee' then perform public.handle_part_refused(p_part, trim(p_reason)); end if;
end $$;

/* ---------- Annuler toute la commande ----------
   Client : tant qu'elle est en attente, ou si elle est partielle et pas encore partie en livraison.
   Super-admin : tant qu'elle n'est pas terminée. */
create or replace function public.cancel_order(p_order uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders; p record; paid numeric;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Commande introuvable'; end if;

  if public.is_admin() then
    if o.status in ('livree', 'retiree', 'refusee', 'annulee') then raise exception 'Commande déjà close'; end if;
  elsif o.customer_id = (select auth.uid()) then
    if not (o.status = 'en_attente' or (o.is_partial and o.status in ('en_cours', 'prete_retrait'))) then
      raise exception 'Cette commande ne peut plus être annulée';
    end if;
  else
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  for p in select * from public.order_parts where order_id = p_order and status not in ('refusee', 'annulee') loop
    perform public.restore_part_stock(p.id);
    update public.order_parts set status = 'annulee' where id = p.id;
    insert into public.order_status_history (order_id, order_part_id, from_status, to_status, changed_by, reason)
    values (p_order, p.id, p.status, 'annulee', (select auth.uid()), p_reason);
    insert into public.notifications (brand_id, order_id, title, body)
    values (p.brand_id, p_order, 'Commande ' || o.number || ' annulée', 'Ne plus préparer cette commande.');
  end loop;

  update public.orders set status = 'annulee', adjusted_total = 0 where id = p_order;
  insert into public.order_status_history (order_id, from_status, to_status, changed_by, reason)
  values (p_order, o.status, 'annulee', (select auth.uid()), p_reason);

  update public.payments set status = 'annule' where order_id = p_order and kind = 'paiement' and status = 'en_attente';
  select coalesce(sum(amount) filter (where kind = 'paiement' and status = 'paye'), 0)
       - coalesce(sum(amount) filter (where kind = 'remboursement' and status <> 'annule'), 0)
    into paid from public.payments where order_id = p_order;
  if paid > 0 then
    insert into public.payments (order_id, kind, method, amount, status)
    values (p_order, 'remboursement', o.payment_method, paid, 'en_attente');
  end if;
end $$;

/* ---------- Attribuer un livreur : quand toutes les parts actives sont prêtes ---------- */
create or replace function public.assign_rider(p_order uuid, p_rider uuid, p_eta int default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare o public.orders; not_ready int; d_id uuid;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Commande introuvable'; end if;
  if not (public.is_admin() or public.is_order_employee(p_order)) then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if o.mode <> 'livraison' or o.status <> 'en_cours' then raise exception 'Commande non livrable pour l''instant'; end if;

  select count(*) into not_ready from public.order_parts
  where order_id = p_order and status not in ('prete', 'collectee', 'refusee', 'annulee');
  if not_ready > 0 then raise exception 'Toutes les parts ne sont pas encore prêtes (% restante(s))', not_ready; end if;

  insert into public.deliveries (order_id, rider_id, assigned_by, eta_minutes)
  values (p_order, p_rider, (select auth.uid()), p_eta)
  on conflict (order_id) do update set rider_id = excluded.rider_id, assigned_by = excluded.assigned_by,
                                       eta_minutes = excluded.eta_minutes, assigned_at = now()
  returning id into d_id;

  insert into public.notifications (profile_id, order_id, title, body)
  select r.profile_id, p_order, 'Nouvelle course ' || o.number,
         'À récupérer chez : ' || (select string_agg(b.name, ', ') from public.order_parts p join public.brands b on b.id = p.brand_id
                                   where p.order_id = p_order and p.status in ('prete', 'collectee'))
  from public.riders r where r.id = p_rider;
  return d_id;
end $$;

/* ---------- Livreur : commande livrée (espèces encaissées si paiement à la livraison) ---------- */
create or replace function public.mark_delivered(p_order uuid, p_cash numeric default null) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not (public.is_admin() or public.is_order_rider(p_order)) then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if o.status <> 'en_livraison' then raise exception 'La commande n''est pas en livraison'; end if;

  update public.deliveries set delivered_at = now(), cash_collected = p_cash where order_id = p_order;
  update public.orders set status = 'livree' where id = p_order;
  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
  values (p_order, o.status, 'livree', (select auth.uid()));

  if o.payment_method = 'especes' then
    update public.payments set status = 'paye', paid_at = now(), collected_by = (select auth.uid()),
                               amount = o.adjusted_total
    where order_id = p_order and kind = 'paiement' and status = 'en_attente';
  end if;
end $$;

/* ---------- Retrait : prête au point de retrait, puis retirée ---------- */
create or replace function public.set_pickup_status(p_order uuid, p_status public.order_status) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders; not_in int;
begin
  select * into o from public.orders where id = p_order for update;
  if o.mode <> 'retrait' then raise exception 'Commande en livraison, pas en retrait'; end if;
  if not (public.is_admin() or public.is_brand_employee(o.pickup_brand_id)) then raise exception 'Accès refusé' using errcode = '42501'; end if;

  if p_status = 'prete_retrait' and o.status = 'en_cours' then
    select count(*) into not_in from public.order_parts
    where order_id = p_order and status not in ('collectee', 'refusee', 'annulee');
    if not_in > 0 then raise exception 'Toutes les parts ne sont pas au point de retrait (% restante(s))', not_in; end if;
  elsif not (p_status = 'retiree' and o.status = 'prete_retrait') then
    raise exception 'Changement impossible : % → %', o.status, p_status;
  end if;

  update public.orders set status = p_status where id = p_order;
  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
  values (p_order, o.status, p_status, (select auth.uid()));

  if p_status = 'prete_retrait' then
    insert into public.notifications (profile_id, recipient_phone, order_id, channel, title, body)
    values (o.customer_id, case when o.customer_id is null then o.customer_phone end, p_order,
            case when o.customer_id is null then 'whatsapp' else 'app' end::public.notif_channel,
            'Commande ' || o.number || ' prête', 'Votre commande vous attend au point de retrait.');
  end if;
end $$;

/* ---------- Vue super-admin : une ligne par commande, même multi-brands ---------- */
create view public.admin_orders with (security_invoker = true) as
select
  o.id, o.number, o.created_at, o.status, public.order_tab(o.status) as tab,
  o.mode, o.customer_name, o.customer_phone, o.payment_method,
  o.total, o.adjusted_total, o.is_partial,
  count(p.id) as parts_count,
  count(p.id) filter (where p.status in ('prete', 'collectee')) as parts_ready,
  count(p.id) filter (where p.status = 'refusee') as parts_refused,
  string_agg(b.name || ' : ' || p.status::text, ' · ' order by b.name) as brands_progress,
  (select pr.full_name from public.deliveries d join public.riders r on r.id = d.rider_id
     join public.profiles pr on pr.id = r.profile_id where d.order_id = o.id) as rider_name,
  (select coalesce(sum(amount) filter (where kind = 'remboursement' and status = 'en_attente'), 0)
     from public.payments where order_id = o.id) as refund_pending
from public.orders o
left join public.order_parts p on p.order_id = o.id
left join public.brands b on b.id = p.brand_id
group by o.id;

/* ---------- Droits d'exécution ---------- */
revoke execute on function public.refresh_order(uuid), public.restore_part_stock(uuid),
  public.handle_part_refused(uuid, text), public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_part_status(uuid, public.part_status, text), public.cancel_order(uuid, text),
  public.assign_rider(uuid, uuid, int), public.mark_delivered(uuid, numeric),
  public.set_pickup_status(uuid, public.order_status) from public, anon;
grant execute on function public.place_order(jsonb) to anon, authenticated;
