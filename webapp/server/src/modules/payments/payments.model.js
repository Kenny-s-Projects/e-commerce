import { query } from '../../config/db.js'

// Paiements : accès aux données (SQL uniquement).
// Les fonctions qui écrivent reçoivent `db`, le client de la transaction en cours.

export async function insertPayment(db, { orderId, partId = null, kind = 'paiement', method, provider = null, amount, payerPhone = null, status = 'en_attente' }) {
  const { rows } = await db.query(
    `insert into public.payments (order_id, order_part_id, kind, method, provider, amount, payer_phone, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
    [orderId, partId, kind, method, provider, amount, payerPhone, status],
  )
  return rows[0]
}

/** Montant déjà encaissé et non remboursé */
export async function paidBalance(db, orderId) {
  const { rows } = await db.query(
    `select coalesce(sum(amount) filter (where kind = 'paiement' and status = 'paye'), 0)
          - coalesce(sum(amount) filter (where kind = 'remboursement' and status <> 'annule'), 0) as balance
       from public.payments where order_id = $1`,
    [orderId],
  )
  return Number(rows[0].balance)
}

export async function cancelPendingPayments(db, orderId) {
  await db.query(
    `update public.payments set status = 'annule' where order_id = $1 and kind = 'paiement' and status = 'en_attente'`,
    [orderId],
  )
}

/** Paiement en attente ramené au nouveau total (commande partielle avant paiement) */
export async function setPendingAmount(db, orderId, amount) {
  await db.query(
    `update public.payments set amount = $2 where order_id = $1 and kind = 'paiement' and status = 'en_attente'`,
    [orderId, amount],
  )
}

export async function lockPayment(db, id) {
  const { rows } = await db.query(
    `select pay.*, o.number as order_number, o.status as order_status, o.customer_id
       from public.payments pay join public.orders o on o.id = pay.order_id
      where pay.id = $1 for update of pay`,
    [id],
  )
  return rows[0] ?? null
}

export async function updatePayment(db, id, { status, providerRef, paidAt }) {
  const { rows } = await db.query(
    `update public.payments set status = $2, provider_ref = coalesce($3, provider_ref),
                                paid_at = coalesce($4, paid_at)
      where id = $1 returning *`,
    [id, status, providerRef ?? null, paidAt ?? null],
  )
  return rows[0]
}

export async function insertHistory(db, { orderId, from, to, by, reason }) {
  await db.query(
    `insert into public.order_status_history (order_id, from_status, to_status, changed_by, reason)
     values ($1, $2, $3, $4, $5)`,
    [orderId, from, to, by, reason ?? null],
  )
}

export async function findPayments({ status, kind, limit, offset }) {
  const { rows } = await query(
    `select pay.id, pay.kind, pay.method, pay.provider, pay.amount, pay.currency, pay.status, pay.provider_ref,
            pay.payer_phone, pay.paid_at, pay.created_at,
            o.id as order_id, o.number as order_number, o.status as order_status, o.customer_name, o.customer_phone,
            p.brand_id as refund_brand_id, b.name as refund_brand,
            count(*) over () as total
       from public.payments pay
       join public.orders o on o.id = pay.order_id
       left join public.order_parts p on p.id = pay.order_part_id
       left join public.brands b on b.id = p.brand_id
      where ($1::public.payment_status is null or pay.status = $1)
        and ($2::public.payment_kind is null or pay.kind = $2)
      order by pay.created_at desc
      limit $3 offset $4`,
    [status ?? null, kind ?? null, limit, offset],
  )
  return rows
}
