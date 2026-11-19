-- kclick · Passage aux vraies données : Patchi seul en vente, les autres Maisons « bientôt disponibles »
-- Source : ERP_Product_Master_Patchi_October_2026.xlsx (28 produits sélectionnés, voir scripts/patchi-selection.json)

/* ---------- Catalogue : référence ERP, vente au poids ---------- */
alter table public.products add column if not exists ref text unique;            -- code ERP (GSB0010, CCD03…)
alter table public.products add column if not exists erp_name text;              -- libellé d'origine dans l'ERP
alter table public.products add column if not exists unit public.sale_unit not null default 'piece';
alter table public.products add column if not exists stock_kg numeric(10, 3) check (stock_kg >= 0); -- stock des produits au poids
alter table public.product_variants add column if not exists weight_grams int check (weight_grams > 0); -- 250, 500, 1000

comment on column public.products.stock_kg is 'Produits vendus au kilo : stock en kg, partagé par les variantes 250 g / 500 g / 1 kg';

/* ---------- Maisons : Patchi en vente, les autres « bientôt disponibles » (Paramètres › Maisons) ---------- */
update public.brands set is_open = (slug = 'patchi');
update public.brands set is_pickup_point = (slug = 'patchi'), pickup_address = case when slug = 'patchi' then '124 Boulevard du 30 Juin, Gombe' end;

/* ---------- Rayons Patchi ---------- */
insert into public.categories (brand_id, slug, name_fr, name_en, position)
select b.id, v.slug, v.fr, v.en, v.pos from public.brands b,
  (values ('smallboxes', 'Petites boîtes', 'Small boxes', 0), ('giftboxes', 'Coffrets', 'Gift boxes', 1),
          ('deluxe', 'Deluxe', 'Deluxe', 2), ('classic', 'Classiques', 'Classics', 3),
          ('sansucre', 'Sans sucre ajouté', 'No added sugar', 4)) as v(slug, fr, en, pos)
where b.slug = 'patchi'
on conflict (brand_id, slug) do update set name_fr = excluded.name_fr, name_en = excluded.name_en, position = excluded.position;
update public.categories c set position = 10 + c.position
  from public.brands b where b.id = c.brand_id and b.slug = 'patchi' and c.slug not in ('smallboxes', 'giftboxes', 'deluxe', 'classic', 'sansucre');

/* ---------- Les 28 produits Patchi sélectionnés ---------- */
create temporary table patchi_selection on commit drop as
select * from jsonb_to_recordset('[{"code": "GSB0010", "erp": "SMALL BOX FILLED 100 GR CHOCOLATE OUNCE", "category": "smallboxes", "unit": "piece", "price": 17.83, "stock": 37, "size": "100 g", "fr": "Petite boîte garnie Ounce, 100 g", "en": "Small filled box Ounce, 100 g"}, {"code": "GSB0013", "erp": "GREEN BOX FILLED 200 GR CHOCOLATE", "category": "smallboxes", "unit": "piece", "price": 36.09, "stock": 37, "size": "200 g", "fr": "Boîte verte garnie, 200 g", "en": "Green filled box, 200 g"}, {"code": "GSB0014", "erp": "SMALL BOX FILLED 135 GR CHOCOLATE", "category": "smallboxes", "unit": "piece", "price": 25.22, "stock": 31, "size": "135 g", "fr": "Petite boîte garnie, 135 g", "en": "Small filled box, 135 g"}, {"code": "CCN30", "erp": "CHOCOLATE WAFER PATCHI GOLD", "category": "classic", "unit": "kg", "price": 96.09, "stock": 21.5, "fr": "Gaufrette Patchi Gold", "en": "Patchi Gold wafer"}, {"code": "CCD04", "erp": "CHOCOLATE WAFER MILK SQUARE", "category": "deluxe", "unit": "kg", "price": 96.09, "stock": 16, "fr": "Gaufrette carrée au lait", "en": "Milk square wafer"}, {"code": "CCD05", "erp": "PRESTIGE - CHOCOLATE", "category": "deluxe", "unit": "kg", "price": 96.09, "stock": 15, "fr": "Prestige", "en": "Prestige"}, {"code": "CCD44", "erp": "CROQ ALMOND - CHOCOLATE", "category": "deluxe", "unit": "kg", "price": 105.22, "stock": 15, "fr": "Croq’ Amande", "en": "Croq Almond"}, {"code": "CCD45", "erp": "CROQ HAZELNUT - CHOCOLATE", "category": "deluxe", "unit": "kg", "price": 105.22, "stock": 15, "fr": "Croq’ Noisette", "en": "Croq Hazelnut"}, {"code": "CCD46", "erp": "CHOCOLATE CROQ PISTACHIO + RAISIN - BRONZE", "category": "deluxe", "unit": "kg", "price": 105.22, "stock": 15, "fr": "Croq’ Pistache et raisin, bronze", "en": "Croq Pistachio and raisin, bronze"}, {"code": "CCD153", "erp": "CHOCOLATE ECLAT", "category": "deluxe", "unit": "kg", "price": 96.09, "stock": 14, "fr": "Éclat", "en": "Eclat"}, {"code": "GGF0016", "erp": "ORANGE BOX FILLED 465 GR CHOCOLATE", "category": "giftboxes", "unit": "piece", "price": 77.83, "stock": 12, "size": "465 g", "fr": "Coffret orange garni, 465 g", "en": "Orange filled gift box, 465 g"}, {"code": "GGF0017", "erp": "BRICK BOX FILLED 470 GR CHOCOLATE", "category": "giftboxes", "unit": "piece", "price": 76.52, "stock": 12, "size": "470 g", "fr": "Coffret brique garni, 470 g", "en": "Brick filled gift box, 470 g"}, {"code": "GGF0018", "erp": "BOX FILLED 445 GR CHOCOLATE", "category": "giftboxes", "unit": "piece", "price": 75.22, "stock": 12, "size": "445 g", "fr": "Coffret garni, 445 g", "en": "Filled gift box, 445 g"}, {"code": "GSB0004", "erp": "ORANGE BOX FILLED 195 GR CHOCOLATE", "category": "smallboxes", "unit": "piece", "price": 38.7, "stock": 12, "size": "195 g", "fr": "Boîte orange garnie, 195 g", "en": "Orange filled box, 195 g"}, {"code": "GSB0005", "erp": "BOX FILLED 205GRS CHOCOLATE", "category": "smallboxes", "unit": "piece", "price": 37.83, "stock": 12, "size": "205 g", "fr": "Boîte garnie, 205 g", "en": "Filled box, 205 g"}, {"code": "GSB0011", "erp": "LARGE BOX FILLED 250 GR CHOCOLATE OUNCE", "category": "smallboxes", "unit": "piece", "price": 38.26, "stock": 12, "size": "250 g", "fr": "Grande boîte garnie Ounce, 250 g", "en": "Large filled box Ounce, 250 g"}, {"code": "GSB0012", "erp": "SMALL GREEN BOX FILLED 315 GR CHOCOLATE", "category": "smallboxes", "unit": "piece", "price": 54.35, "stock": 12, "size": "315 g", "fr": "Boîte verte garnie, 315 g", "en": "Green filled box, 315 g"}, {"code": "GSB0015", "erp": "BOX FILLED WITH 160 GRS CHOCOLATE", "category": "smallboxes", "unit": "piece", "price": 33.48, "stock": 12, "size": "160 g", "fr": "Boîte garnie, 160 g", "en": "Filled box, 160 g"}, {"code": "CCD03", "erp": "CAPRICIO - CHOCOLATE", "category": "deluxe", "unit": "kg", "price": 96.09, "stock": 10, "fr": "Capricio", "en": "Capricio"}, {"code": "CCD11", "erp": "PARFAIT - CHOCOLATE", "category": "deluxe", "unit": "kg", "price": 96.09, "stock": 10, "fr": "Parfait", "en": "Parfait"}, {"code": "CCD13", "erp": "AMANDINE CHOCOLATE", "category": "deluxe", "unit": "kg", "price": 96.09, "stock": 10, "fr": "Amandine", "en": "Amandine"}, {"code": "CCF03", "erp": "NO ADDED SUGAR MILK CHOCO. W/NUTS", "category": "sansucre", "unit": "kg", "price": 114.35, "stock": 10, "fr": "Lait aux fruits secs, sans sucre ajouté", "en": "Milk chocolate with nuts, no added sugar"}, {"code": "CCF04", "erp": "NO ADDED SUGAR BITTER CHOCO. W/ALMOND", "category": "sansucre", "unit": "kg", "price": 114.35, "stock": 10, "fr": "Noir aux amandes, sans sucre ajouté", "en": "Dark chocolate with almonds, no added sugar"}, {"code": "CCN01", "erp": "FINESSE - CHOCOLATE", "category": "classic", "unit": "kg", "price": 96.09, "stock": 10, "fr": "Finesse", "en": "Finesse"}, {"code": "CCN02", "erp": "NOBLESSE - CHOCOLATE", "category": "classic", "unit": "kg", "price": 96.09, "stock": 10, "fr": "Noblesse", "en": "Noblesse"}, {"code": "CCN03", "erp": "AUDACE - CHOCOLATE", "category": "classic", "unit": "kg", "price": 96.09, "stock": 10, "fr": "Audace", "en": "Audace"}, {"code": "CCN04", "erp": "DIAMANTINE - CHOCOLATE", "category": "classic", "unit": "kg", "price": 96.09, "stock": 10, "fr": "Diamantine", "en": "Diamantine"}, {"code": "CCN19", "erp": "CROQUET - CHOCOLATE", "category": "classic", "unit": "kg", "price": 96.09, "stock": 10, "fr": "Croquet", "en": "Croquet"}]'::jsonb)
  as x(code text, erp text, category text, unit text, price numeric, stock numeric, size text, fr text, en text);

-- Anciens produits Patchi de démonstration hors sélection : désactivés (pas supprimés)
update public.products p set is_active = false
  from public.brands b
 where b.id = p.brand_id and b.slug = 'patchi' and upper(p.slug) not in (select code from patchi_selection);

insert into public.products (brand_id, category_id, slug, ref, erp_name, name_fr, name_en, description_fr, description_en,
                             base_price, unit, stock_kg, is_active)
select b.id, c.id, lower(s.code), s.code, s.erp, s.fr, s.en,
       case when s.unit = 'kg' then 'Chocolats Patchi vendus au poids : 250 g, 500 g ou 1 kg.'
            else 'Boîte garnie de chocolats Patchi assortis, ' || s.size || '.' end,
       case when s.unit = 'kg' then 'Patchi chocolates sold by weight: 250 g, 500 g or 1 kg.'
            else 'Box filled with assorted Patchi chocolates, ' || s.size || '.' end,
       case when s.unit = 'kg' then round(s.price * 0.25, 2) else s.price end,
       s.unit::public.sale_unit,
       case when s.unit = 'kg' then s.stock end,
       true
  from patchi_selection s
  join public.brands b on b.slug = 'patchi'
  left join public.categories c on c.brand_id = b.id and c.slug = s.category
on conflict (slug) do update set
  category_id = excluded.category_id, ref = excluded.ref, erp_name = excluded.erp_name,
  name_fr = excluded.name_fr, name_en = excluded.name_en,
  description_fr = excluded.description_fr, description_en = excluded.description_en,
  base_price = excluded.base_price, unit = excluded.unit, stock_kg = excluded.stock_kg, is_active = true;

-- Variantes : refaites à partir du fichier (les commandes gardent leur copie du nom et du prix)
delete from public.product_variants v using public.products p
 where p.id = v.product_id and p.ref in (select code from patchi_selection);

insert into public.product_variants (product_id, label, sku_eshopaid, price, unit, stock, weight_grams, is_default, position)
select p.id, w.label, s.code || '-' || w.suffix, round(s.price * w.kg, 2), 'kg', 0, w.grams, w.pos = 0, w.pos
  from patchi_selection s join public.products p on p.ref = s.code,
       (values ('250 g', '250G', 0.25, 250, 0), ('500 g', '500G', 0.5, 500, 1), ('1 kg', '1KG', 1.0, 1000, 2)) as w(label, suffix, kg, grams, pos)
 where s.unit = 'kg';

insert into public.product_variants (product_id, label, sku_eshopaid, price, unit, stock, is_default, position)
select p.id, 'Standard', s.code, s.price, 'piece', s.stock::int, true, 0
  from patchi_selection s join public.products p on p.ref = s.code
 where s.unit = 'piece';

-- Photos de démonstration retirées : les vraies photos viendront de Supabase Storage (bucket patchi)
delete from public.product_images i using public.products p
 where p.id = i.product_id and p.ref in (select code from patchi_selection) and i.url like '/img/%';

/* ---------- Photos : un bucket public par Maison (classement : products/<CODE>/<n>.webp) ---------- */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyra', 'kyra', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
       ('patchi', 'patchi', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
       ('adidas', 'adidas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
       ('celio', 'celio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- Lecture publique (buckets publics). L'envoi des photos passe par l'API (clé serveur), jamais par le navigateur.

/* ---------- Invitations de l'équipe : le rôle est donné à la première connexion par code e-mail ---------- */
create table if not exists public.staff_invitations (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique check (email = lower(email)),
  first_name   text,
  last_name    text,
  phone        text,
  role         public.app_role not null check (role <> 'client'),
  brand_id     uuid references public.brands (id) on delete cascade,
  vehicle      text,
  zone         text,
  invited_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  constraint employe_invitation_has_brand check (role <> 'employe' or brand_id is not null)
);
alter table public.staff_invitations enable row level security;
create policy "invitations : super-admin lecture" on public.staff_invitations for select to authenticated using (public.is_admin());

-- Super admin de départ
insert into public.staff_invitations (email, first_name, last_name, role)
values ('ecommerce@kennysinternational.com', 'Kenny’s', 'International', 'super_admin')
on conflict (email) do nothing;

-- Statut d'un compte d'équipe (désactivé par le super admin)
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- Nouveau compte : profil + rôle client, et rôle d'équipe si une invitation existe pour cet e-mail
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare inv public.staff_invitations;
begin
  select * into inv from public.staff_invitations
   where email = lower(new.email) and accepted_at is null and revoked_at is null;

  insert into public.profiles (id, email, full_name, phone)
  values (new.id, lower(new.email),
          coalesce(new.raw_user_meta_data ->> 'full_name', nullif(trim(coalesce(inv.first_name, '') || ' ' || coalesce(inv.last_name, '')), '')),
          coalesce(new.phone, new.raw_user_meta_data ->> 'phone', inv.phone));
  insert into public.user_roles (user_id, role) values (new.id, 'client');

  if inv.id is not null then
    insert into public.user_roles (user_id, role, brand_id) values (new.id, inv.role, inv.brand_id)
    on conflict do nothing;
    if inv.role = 'livreur' then
      insert into public.riders (profile_id, vehicle, zone) values (new.id, coalesce(inv.vehicle, 'Moto'), coalesce(inv.zone, 'Gombe'))
      on conflict (profile_id) do nothing;
    end if;
    update public.staff_invitations set accepted_at = now() where id = inv.id;
  end if;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;


/* ---------- Logique des commandes : désormais dans l'API Express ---------- */
drop function if exists public.place_order(jsonb);
drop function if exists public.set_part_status(uuid, public.part_status, text);
drop function if exists public.cancel_order(uuid, text);
drop function if exists public.assign_rider(uuid, uuid, int);
drop function if exists public.mark_delivered(uuid, numeric);
drop function if exists public.set_pickup_status(uuid, public.order_status);
drop function if exists public.handle_part_refused(uuid, text);
drop function if exists public.refresh_order(uuid);
drop function if exists public.restore_part_stock(uuid);
