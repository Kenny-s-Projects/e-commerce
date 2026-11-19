import { query } from '../../config/db.js'

// Commandes : accès aux données (SQL uniquement).
// Les fonctions qui écrivent reçoivent `db`, le client de la transaction en cours.

/* ---------- Création ---------- */

/** Variantes commandées, verrouillées jusqu'à la fin de la transaction (le stock ne bouge pas entre-temps) */
export async function lockVariants(db, variantIds) {
  const { rows } = await db.query(
    `select v.id, v.label, v.price, v.stock, v.weight_grams, v.is_active and p.is_active as active,
            p.id as product_id, p.ref, p.name_fr, p.unit, p.brand_id, b.is_open as brand_open, b.name as brand_name
       from public.product_variants v
       join public.products p on p.id = v.product_id
       join public.brands b on b.id = p.brand_id
      where v.id = any($1::uuid[])
      order by v.id
      for update of v`,
    [variantIds],
  )
  return rows
}

/** Produits vendus au kilo : stock en kg verrouillé (partagé par les variantes 250 g / 500 g / 1 kg) */
export async function lockKgStock(db, productIds) {
  if (!productIds.length) return new Map()
  const { rows } = await db.query(
    `select id, coalesce(stock_kg, 0) as stock_kg from public.products where id = any($1::uuid[]) order by id for update`,
    [productIds],
  )
  return new Map(rows.map((r) => [r.id, Number(r.stock_kg)]))
}

export async function decrementVariantStock(db, variantId, qty) {
  await db.query('update public.product_variants set stock = stock - $2 where id = $1', [variantId, qty])
}

export async function decrementKgStock(db, productId, kg) {
  await db.query('update public.products set stock_kg = stock_kg - $2 where id = $1', [productId, kg])
}

export async function findPickupBrand(db) {
  const { rows } = await db.query(
    'select id, name, pickup_address from public.brands where is_pickup_point order by created_at limit 1',
  )
  return rows[0] ?? null
}

export async function insertOrder(db, o) {
  const { rows } = await db.query(
    `insert into public.orders (customer_id, customer_name, customer_phone, customer_email, mode, address_snapshot,
                                pickup_brand_id, payment_method, subtotal, delivery_fee, total, adjusted_total, customer_note)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12)
     returning id, number, status, created_at`,
    [o.customerId, o.name, o.phone, o.email, o.mode, o.address, o.pickupBrandId, o.paymentMethod,
     o.subtotal, o.deliveryFee, o.total, o.note],
  )
  return rows[0]
}

export async function insertPart(db, { orderId, brandId, amountDue }) {
  const { rows } = await db.query(
    'insert into public.order_parts (order_id, brand_id, amount_due) values ($1, $2, $3) returning id',
    [orderId, brandId, amountDue],
  )
  return rows[0].id
}

export async function insertItem(db, { partId, variantId, productName, variantLabel, unitPrice, quantity, giftMessage }) {
  await db.query(
    `insert into public.order_items (order_part_id, variant_id, product_name, variant_label, unit_price, quantity, gift_message)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [partId, variantId, productName, variantLabel, unitPrice, quantity, giftMessage ?? null],
  )
}

export async function insertHistory(db, { orderId, partId = null, from = null, to, by = null, reason = null }) {
  await db.query(
    `insert into public.order_status_history (order_id, order_part_id, from_status, to_status, changed_by, reason)
     values ($1, $2, $3, $4, $5, $6)`,
    [orderId, partId, from, to, by, reason],
  )
}

/* ---------- Mise à jour ---------- */

export async function lockOrder(db, id) {
  const { rows } = await db.query('select * from public.orders where id = $1 for update', [id])
  return rows[0] ?? null
}

export async function findParts(db, orderId) {
  const { rows } = await db.query(
    `select p.*, b.slug as brand, b.name as brand_name from public.order_parts p
       join public.brands b on b.id = p.brand_id
      where p.order_id = $1 order by b.created_at for update of p`,
    [orderId],
  )
  return rows
}

export async function lockPart(db, partId) {
  const { rows } = await db.query(
    `select p.*, b.slug as brand, b.name as brand_name from public.order_parts p
       join public.brands b on b.id = p.brand_id where p.id = $1 for update of p`,
    [partId],
  )
  return rows[0] ?? null
}

/** Remet en stock les articles d'une part (annulation, refus) : variante à la pièce, ou kg sur le produit */
export async function restorePartStock(db, partId) {
  await db.query(
    `update public.product_variants v set stock = v.stock + i.qty
       from (select oi.variant_id, sum(oi.quantity)::int as qty
               from public.order_items oi
               join public.product_variants pv on pv.id = oi.variant_id
               join public.products p on p.id = pv.product_id
              where oi.order_part_id = $1 and p.unit = 'piece'
              group by oi.variant_id) i
      where v.id = i.variant_id`,
    [partId],
  )
  await db.query(
    `update public.products p set stock_kg = coalesce(p.stock_kg, 0) + i.kg
       from (select pv.product_id, sum(pv.weight_grams * oi.quantity) / 1000.0 as kg
               from public.order_items oi
               join public.product_variants pv on pv.id = oi.variant_id
               join public.products pr on pr.id = pv.product_id
              where oi.order_part_id = $1 and pr.unit = 'kg' and pv.weight_grams is not null
              group by pv.product_id) i
      where p.id = i.product_id`,
    [partId],
  )
}

export async function setPartState(db, partId, { status, refusalReason }) {
  await db.query(
    `update public.order_parts set
       status = $2::text::public.part_status,
       refusal_reason = coalesce($3, refusal_reason),
       accepted_at  = case when $2::text = 'en_preparation' and accepted_at is null then now() else accepted_at end,
       ready_at     = case when $2::text = 'prete'     then now() else ready_at end,
       collected_at = case when $2::text = 'collectee' then now() else collected_at end,
       refused_at   = case when $2::text = 'refusee'   then now() else refused_at end
     where id = $1`,
    [partId, status, refusalReason ?? null],
  )
}

export async function setOrderState(db, id, { status, adjustedTotal, isPartial }) {
  await db.query(
    `update public.orders set status = coalesce($2, status), adjusted_total = coalesce($3, adjusted_total),
                              is_partial = coalesce($4, is_partial)
      where id = $1`,
    [id, status ?? null, adjustedTotal ?? null, isPartial ?? null],
  )
}

/* ---------- Lecture : forme « dashboard » (voir orders.present.js) ---------- */

// Une commande complète en une ligne JSON : parts (avec articles et qui les a préparées), paiement, livraison, annulation
const ORDER_ROW = `
  select o.id, o.number, o.created_at, o.customer_id, o.customer_name, o.customer_phone, o.customer_email,
         o.mode, o.address_snapshot, o.delivery_fee, o.subtotal, o.total, o.adjusted_total, o.is_partial,
         o.status, o.payment_method, o.customer_note, o.updated_at,
         o.pickup_brand_id, pb.slug as pickup_brand, pb.name as pickup_brand_name, pb.pickup_address,
         coalesce((select json_agg(x order by x.brand_position) from (
           select p.id, p.brand_id, b.slug as brand, b.name as brand_name, b.created_at as brand_position,
                  p.status, p.amount_due, p.refusal_reason, p.accepted_at, p.ready_at, p.collected_at, p.refused_at,
                  (select h.created_at from public.order_status_history h
                    where h.order_part_id = p.id and h.to_status = 'en_preparation' order by h.created_at limit 1) as started_at,
                  (select pr.full_name from public.order_status_history h join public.profiles pr on pr.id = h.changed_by
                    where h.order_part_id = p.id and h.to_status = 'en_preparation' order by h.created_at limit 1) as staff,
                  coalesce((select json_agg(i order by i.product_name) from (
                    select oi.id, oi.variant_id, oi.product_name, oi.variant_label, oi.unit_price, oi.quantity,
                           oi.line_total, oi.gift_message, prod.ref, prod.slug as product_slug,
                           (select url from public.product_images im where im.product_id = prod.id order by im.position limit 1) as image
                      from public.order_items oi
                      left join public.product_variants pv on pv.id = oi.variant_id
                      left join public.products prod on prod.id = pv.product_id
                     where oi.order_part_id = p.id) i), '[]') as items
             from public.order_parts p join public.brands b on b.id = p.brand_id
            where p.order_id = o.id) x), '[]') as parts,
         (select row_to_json(y) from (
            select method, provider, status, paid_at, provider_ref, amount, created_at
              from public.payments where order_id = o.id and kind = 'paiement'
             order by (status = 'paye') desc, created_at desc limit 1) y) as payment,
         (select coalesce(sum(amount), 0) from public.payments
           where order_id = o.id and kind = 'remboursement' and status = 'en_attente') as refund_pending,
         (select row_to_json(d) from (
            select d.rider_id, d.eta_minutes, d.assigned_at, d.picked_up_at, d.delivered_at,
                   pr.full_name as rider_name, r.profile_id as rider_profile_id
              from public.deliveries d join public.riders r on r.id = d.rider_id
              join public.profiles pr on pr.id = r.profile_id
             where d.order_id = o.id) d) as delivery,
         (select row_to_json(c) from (
            select reason, created_at from public.order_status_history
             where order_id = o.id and order_part_id is null and to_status = 'annulee'
             order by created_at desc limit 1) c) as cancellation,
         (select max(created_at) from public.order_status_history
           where order_id = o.id and order_part_id is null and to_status in ('livree', 'retiree')) as closed_at,
         count(*) over () as total_count
    from public.orders o
    left join public.brands pb on pb.id = o.pickup_brand_id`

export async function findOrderRow(id) {
  const { rows } = await query(`${ORDER_ROW} where o.id = $1`, [id])
  return rows[0] ?? null
}

export async function findOrderRowByNumber(number) {
  const { rows } = await query(`${ORDER_ROW} where o.number = $1`, [number])
  return rows[0] ?? null
}

/**
 * Liste de commandes (forme dashboard), filtres optionnels :
 *  statuses (order_status[]), since (date), search (numéro, nom, téléphone), brandId (commandes contenant cette Maison),
 *  customerId, riderProfileId, ids
 */
export async function findOrderRows({ statuses, since, search, brandId, customerId, riderProfileId, ids, limit = 50, offset = 0 } = {}) {
  const { rows } = await query(
    `${ORDER_ROW}
      where ($1::text[] is null or o.status::text = any($1::text[]))
        and ($2::timestamptz is null or o.created_at >= $2)
        and ($3::text is null or o.number ilike '%' || $3 || '%' or o.customer_name ilike '%' || $3 || '%'
             or regexp_replace(o.customer_phone, '\\D', '', 'g') like '%' || regexp_replace($3, '\\D', '', 'g') || '%'
                and regexp_replace($3, '\\D', '', 'g') <> '')
        and ($4::uuid is null or exists (select 1 from public.order_parts p where p.order_id = o.id and p.brand_id = $4))
        and ($5::uuid is null or o.customer_id = $5)
        and ($6::uuid is null or exists (select 1 from public.deliveries d join public.riders r on r.id = d.rider_id
                                          where d.order_id = o.id and r.profile_id = $6))
        and ($7::uuid[] is null or o.id = any($7))
      order by o.created_at desc
      limit $8 offset $9`,
    [statuses ?? null, since ?? null, search ?? null, brandId ?? null, customerId ?? null, riderProfileId ?? null, ids ?? null, limit, offset],
  )
  return rows
}

/** Commandes d'un client, résumé pour la liste « mes commandes » */
export async function findByCustomer(customerId, statuses) {
  const { rows } = await query(
    `select o.id, o.number, o.status, o.mode, o.total, o.adjusted_total, o.is_partial, o.created_at,
            (select count(*)::int from public.order_items i join public.order_parts p on p.id = i.order_part_id
              where p.order_id = o.id) as items_count,
            (select string_agg(b.name, ', ' order by b.name) from public.order_parts p
               join public.brands b on b.id = p.brand_id where p.order_id = o.id) as brands
       from public.orders o
      where o.customer_id = $1 and ($2::text[] is null or o.status::text = any($2))
      order by o.created_at desc
      limit 100`,
    [customerId, statuses ?? null],
  )
  return rows
}

export async function findBrandBySlug(slug) {
  const { rows } = await query('select id, slug, name, is_open from public.brands where slug = $1', [slug])
  return rows[0] ?? null
}
