import { query } from '../../config/db.js'

// Vue d'ensemble du super-admin : accès aux données (SQL uniquement).

/** Ventes par Maison sur la période (hors parts refusées / annulées) */
export async function salesByBrand(since) {
  const { rows } = await query(
    `select b.slug as brand, b.name, b.color, b.is_open, coalesce(sum(p.amount_due), 0) as amount, count(p.id)::int as parts
       from public.brands b
       left join public.order_parts p on p.brand_id = b.id and p.status not in ('refusee', 'annulee')
            and exists (select 1 from public.orders o where o.id = p.order_id and o.created_at >= $1)
      group by b.id order by b.created_at`,
    [since],
  )
  return rows
}

/** Durée moyenne commande → remise (minutes), commandes livrées sur la période */
export async function averageDeliveryMinutes(since) {
  const { rows } = await query(
    `select avg(extract(epoch from (d.delivered_at - o.created_at)) / 60) as minutes
       from public.deliveries d join public.orders o on o.id = d.order_id
      where d.delivered_at is not null and o.created_at >= $1`,
    [since],
  )
  return rows[0].minutes == null ? null : Math.round(Number(rows[0].minutes))
}

/** Produits actifs en rupture (pièce : stock 0 ; kilo : moins de 250 g) dans les Maisons ouvertes */
export async function outOfStock() {
  const { rows } = await query(
    `select p.ref, p.name_fr, b.slug as brand, b.name as brand_name, p.unit, p.stock_kg,
            (select coalesce(sum(v.stock), 0)::int from public.product_variants v where v.product_id = p.id and v.is_active) as stock
       from public.products p join public.brands b on b.id = p.brand_id
      where p.is_active and b.is_open
        and (case when p.unit = 'kg' then coalesce(p.stock_kg, 0) < 0.25
                  else not exists (select 1 from public.product_variants v where v.product_id = p.id and v.is_active and v.stock > 0) end)
      order by b.created_at, p.name_fr`,
  )
  return rows
}
