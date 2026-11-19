-- kclick · Corrections après les conseillers Supabase (sécurité + performance)

/* ---------- Sécurité : les fonctions de contrôle des rôles ne sont pas appelables sans compte ----------
   Les visiteurs (anon) n'ont besoin que de place_order. La lecture du catalogue par anon
   ne dépend plus de is_admin() / is_brand_employee(). */
drop policy "produits : actifs pour tous" on public.products;
create policy "produits : actifs (visiteurs)" on public.products for select to anon using (is_active);
create policy "produits : actifs, ou sa brand, ou admin" on public.products for select to authenticated
  using (is_active or public.is_admin() or public.is_brand_employee(brand_id));

revoke execute on function public.has_role(public.app_role), public.is_admin(), public.is_brand_employee(uuid),
  public.is_order_customer(uuid), public.is_order_rider(uuid), public.is_order_employee(uuid),
  public.can_see_order(uuid), public.can_see_part(uuid) from public, anon;

/* ---------- Performance : une seule règle par action ---------- */
-- Écritures super-admin : insert / update / delete séparés de la lecture
do $$
declare t text;
begin
  foreach t in array array['brands', 'categories', 'products', 'product_images'] loop
    execute format('drop policy if exists %I on public.%I', case t
      when 'brands' then 'brands : super-admin' when 'categories' then 'rayons : super-admin'
      when 'products' then 'produits : super-admin' else 'photos : super-admin' end, t);
    execute format('create policy "admin : ajouter" on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "admin : modifier" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admin : supprimer" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

drop policy "variantes : super-admin" on public.product_variants;
drop policy "variantes : stock par la brand" on public.product_variants;
create policy "variantes : ajouter (admin)" on public.product_variants for insert to authenticated with check (public.is_admin());
create policy "variantes : modifier (admin, stock par la brand)" on public.product_variants for update to authenticated
  using (public.is_admin() or public.is_brand_employee((select p.brand_id from public.products p where p.id = product_id)))
  with check (public.is_admin() or public.is_brand_employee((select p.brand_id from public.products p where p.id = product_id)));
create policy "variantes : supprimer (admin)" on public.product_variants for delete to authenticated using (public.is_admin());

drop policy "horaires : brand ou super-admin" on public.brand_hours;
create policy "horaires : ajouter" on public.brand_hours for insert to authenticated
  with check (public.is_admin() or public.is_brand_employee(brand_id));
create policy "horaires : modifier" on public.brand_hours for update to authenticated
  using (public.is_admin() or public.is_brand_employee(brand_id)) with check (public.is_admin() or public.is_brand_employee(brand_id));
create policy "horaires : supprimer" on public.brand_hours for delete to authenticated
  using (public.is_admin() or public.is_brand_employee(brand_id));

drop policy "rôles : super-admin" on public.user_roles;
create policy "rôles : ajouter (admin)" on public.user_roles for insert to authenticated with check (public.is_admin());
create policy "rôles : modifier (admin)" on public.user_roles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "rôles : supprimer (admin)" on public.user_roles for delete to authenticated using (public.is_admin());

drop policy "cash : la brand confirme" on public.cash_handovers;
create policy "cash : ajouter (brand)" on public.cash_handovers for insert to authenticated
  with check (public.is_admin() or public.is_brand_employee(brand_id));
create policy "cash : confirmer (brand)" on public.cash_handovers for update to authenticated
  using (public.is_admin() or public.is_brand_employee(brand_id)) with check (public.is_admin() or public.is_brand_employee(brand_id));

drop policy "adresses : les siennes" on public.addresses;
drop policy "adresses : admin lecture" on public.addresses;
create policy "adresses : voir les siennes (admin : toutes)" on public.addresses for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin());
create policy "adresses : ajouter" on public.addresses for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "adresses : modifier" on public.addresses for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "adresses : supprimer" on public.addresses for delete to authenticated using (profile_id = (select auth.uid()));

/* ---------- Performance : index sur les liens restants ---------- */
create index on public.cart_items (variant_id);
create index on public.cash_handovers (brand_id);
create index on public.cash_handovers (confirmed_by);
create index on public.categories (parent_id);
create index on public.deliveries (assigned_by);
create index on public.favorites (product_id);
create index on public.order_items (variant_id);
create index on public.order_status_history (changed_by);
create index on public.order_status_history (order_part_id);
create index on public.orders (pickup_brand_id);
create index on public.payments (collected_by);
create index on public.payments (order_part_id);
create index on public.product_images (variant_id);
