-- kclick · Règles d'accès par rôle (Row Level Security)
-- Les commandes ne s'écrivent pas directement : elles passent par les fonctions
-- place_order, set_part_status, cancel_order, assign_rider, mark_delivered, set_pickup_status.

alter table public.profiles             enable row level security;
alter table public.user_roles           enable row level security;
alter table public.brands               enable row level security;
alter table public.brand_hours          enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.product_images       enable row level security;
alter table public.riders               enable row level security;
alter table public.addresses            enable row level security;
alter table public.cart_items           enable row level security;
alter table public.favorites            enable row level security;
alter table public.orders               enable row level security;
alter table public.order_parts          enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments             enable row level security;
alter table public.deliveries           enable row level security;
alter table public.cash_handovers       enable row level security;
alter table public.notifications        enable row level security;

/* ---------- Comptes ---------- */
create policy "profil : le sien, admin, employés voient les livreurs" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin()
         or (public.has_role('employe') and exists (select 1 from public.riders r where r.profile_id = profiles.id)));
create policy "profil : modifier le sien" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin()) with check (id = (select auth.uid()) or public.is_admin());

-- Seul le super-admin attribue les rôles
create policy "rôles : voir les siens" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "rôles : super-admin" on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

/* ---------- Catalogue : lecture publique, écriture super-admin (stock : employés de la brand) ---------- */
create policy "brands : lecture" on public.brands for select to anon, authenticated using (true);
create policy "brands : super-admin" on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "horaires : lecture" on public.brand_hours for select to anon, authenticated using (true);
create policy "horaires : brand ou super-admin" on public.brand_hours for all to authenticated
  using (public.is_admin() or public.is_brand_employee(brand_id)) with check (public.is_admin() or public.is_brand_employee(brand_id));

create policy "rayons : lecture" on public.categories for select to anon, authenticated using (true);
create policy "rayons : super-admin" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "produits : actifs pour tous" on public.products for select to anon, authenticated
  using (is_active or public.is_admin() or public.is_brand_employee(brand_id));
create policy "produits : super-admin" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "variantes : lecture" on public.product_variants for select to anon, authenticated using (true);
create policy "variantes : super-admin" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "variantes : stock par la brand" on public.product_variants for update to authenticated
  using (public.is_brand_employee((select p.brand_id from public.products p where p.id = product_id)))
  with check (public.is_brand_employee((select p.brand_id from public.products p where p.id = product_id)));

create policy "photos : lecture" on public.product_images for select to anon, authenticated using (true);
create policy "photos : super-admin" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

/* ---------- Livreurs ---------- */
create policy "livreurs : lui-même, employés, admin" on public.riders for select to authenticated
  using (profile_id = (select auth.uid()) or public.has_role('employe') or public.is_admin());
create policy "livreurs : mettre à jour sa dispo" on public.riders for update to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin()) with check (profile_id = (select auth.uid()) or public.is_admin());
create policy "livreurs : super-admin crée" on public.riders for insert to authenticated with check (public.is_admin());
create policy "livreurs : super-admin supprime" on public.riders for delete to authenticated using (public.is_admin());

/* ---------- Espace client : chacun les siens ---------- */
create policy "adresses : les siennes" on public.addresses for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "adresses : admin lecture" on public.addresses for select to authenticated using (public.is_admin());

create policy "panier : le sien" on public.cart_items for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "favoris : les siens" on public.favorites for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

/* ---------- Commandes (lecture seulement ; écriture via les fonctions) ---------- */
create policy "commandes : client, brands concernées, livreur, admin" on public.orders for select to authenticated
  using (public.can_see_order(id));
create policy "commandes : super-admin modifie" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Un employé ne voit que la part de sa brand
create policy "parts : visibles" on public.order_parts for select to authenticated using (public.can_see_part(id));
create policy "articles : visibles" on public.order_items for select to authenticated using (public.can_see_part(order_part_id));

create policy "historique : visible" on public.order_status_history for select to authenticated
  using (public.can_see_order(order_id) and (order_part_id is null or public.can_see_part(order_part_id)));

create policy "paiements : client, livreur, admin" on public.payments for select to authenticated
  using (public.is_admin() or public.is_order_customer(order_id) or public.is_order_rider(order_id));
create policy "paiements : super-admin (remboursements)" on public.payments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "courses : visibles" on public.deliveries for select to authenticated using (public.can_see_order(order_id));
create policy "courses : le livreur met à jour la sienne" on public.deliveries for update to authenticated
  using (public.is_admin() or rider_id = (select r.id from public.riders r where r.profile_id = (select auth.uid())))
  with check (public.is_admin() or rider_id = (select r.id from public.riders r where r.profile_id = (select auth.uid())));

create policy "cash : livreur, brand, admin" on public.cash_handovers for select to authenticated
  using (public.is_admin() or public.is_brand_employee(brand_id)
         or rider_id = (select r.id from public.riders r where r.profile_id = (select auth.uid())));
create policy "cash : la brand confirme" on public.cash_handovers for all to authenticated
  using (public.is_admin() or public.is_brand_employee(brand_id))
  with check (public.is_admin() or public.is_brand_employee(brand_id));

/* ---------- Notifications ---------- */
create policy "notifications : les siennes ou celles de sa brand" on public.notifications for select to authenticated
  using (profile_id = (select auth.uid()) or (brand_id is not null and public.is_brand_employee(brand_id)) or public.is_admin());
create policy "notifications : marquer comme lue" on public.notifications for update to authenticated
  using (profile_id = (select auth.uid()) or (brand_id is not null and public.is_brand_employee(brand_id)) or public.is_admin())
  with check (profile_id = (select auth.uid()) or (brand_id is not null and public.is_brand_employee(brand_id)) or public.is_admin());

grant select on public.admin_orders to authenticated;
revoke all on public.admin_orders from anon;
