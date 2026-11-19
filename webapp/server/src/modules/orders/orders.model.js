import { query } from '../../config/db.js'

// Commandes : accès aux données (SQL uniquement).
// Les fonctions qui écrivent reçoivent `db`, le client de la transaction en cours.

/** Variantes commandées, verrouillées jusqu'à la fin de la transaction (le stock ne bouge pas entre-temps) */
export async function lockVariants(db, variantIds) {
  const { rows } = await db.query(
    `select v.id, v.label, v.price, v.stock, v.is_active and p.is_active as active,
            p.id as product_id, p.name_fr, p.brand_id
       from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = any($1::uuid[])
      order by v.id
      for update of v`,
    [variantIds],
  )
  return rows
}

export async function decrementStock(db, variantId, qty) {
  await db.query('update public.product_variants set stock = stock - $2 where id = $1', [variantId, qty])
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

export async function lockOrder(db, id) {
  const { rows } = await db.query('select * from public.orders where id = $1 for update', [id])
  return rows[0] ?? null
}

export async function findParts(db, orderId) {
  const { rows } = await db.query('select * from public.order_parts where order_id = $1 for update', [orderId])
  return rows
}

/** Remet en stock les articles d'une part (annulation, refus) */
export async function restorePartStock(db, partId) {
  await db.query(
    `update public.product_variants v set stock = v.stock + i.qty
       from (select variant_id, sum(quantity)::int as qty from public.order_items
              where order_part_id = $1 and variant_id is not null group by variant_id) i
      where v.id = i.variant_id`,
    [partId],
  )
}

export async function setPartStatus(db, partId, status) {
  await db.query('update public.order_parts set status = $2 where id = $1', [partId, status])
}

export async function setOrderState(db, id, { status, adjustedTotal, isPartial }) {
  await db.query(
    `update public.orders set status = coalesce($2, status), adjusted_total = coalesce($3, adjusted_total),
                              is_partial = coalesce($4, is_partial)
      where id = $1`,
    [id, status ?? null, adjustedTotal ?? null, isPartial ?? null],
  )
}

/** Commande complète : parts (avec brand et articles), paiements, historique, livraison */
export async function findOrderDetails(id) {
  const { rows } = await query(
    `select o.*,
            pb.name as pickup_brand_name, pb.pickup_address,
            coalesce((select json_agg(x order by x.brand_name) from (
              select p.id, p.brand_id, b.slug as brand, b.name as brand_name, p.status, p.amount_due,
                     p.refusal_reason, p.accepted_at, p.ready_at, p.collected_at, p.refused_at,
                     coalesce((select json_agg(i order by i.product_name) from (
                       select id, variant_id, product_name, variant_label, unit_price, quantity, line_total, gift_message
                         from public.order_items where order_part_id = p.id) i), '[]') as items
                from public.order_parts p join public.brands b on b.id = p.brand_id
               where p.order_id = o.id) x), '[]') as parts,
            coalesce((select json_agg(y order by y.created_at) from (
              select id, kind, method, provider, amount, currency, status, paid_at, created_at
                from public.payments where order_id = o.id) y), '[]') as payments,
            coalesce((select json_agg(h order by h.created_at) from (
              select order_part_id, from_status, to_status, reason, created_at
                from public.order_status_history where order_id = o.id) h), '[]') as history,
            (select json_build_object('rider_id', d.rider_id, 'eta_minutes', d.eta_minutes, 'assigned_at', d.assigned_at,
                                      'picked_up_at', d.picked_up_at, 'delivered_at', d.delivered_at)
               from public.deliveries d where d.order_id = o.id) as delivery
       from public.orders o
       left join public.brands pb on pb.id = o.pickup_brand_id
      where o.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function isRiderOf(orderId, profileId) {
  const { rows } = await query(
    `select 1 from public.deliveries d join public.riders r on r.id = d.rider_id
      where d.order_id = $1 and r.profile_id = $2`,
    [orderId, profileId],
  )
  return rows.length > 0
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
