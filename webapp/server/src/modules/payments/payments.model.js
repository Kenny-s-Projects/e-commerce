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

export async function updatePayment(db, id, { status, providerRef, paidAt, fees, failureReason }) {
  const { rows } = await db.query(
    `update public.payments set status = $2, provider_ref = coalesce($3, provider_ref),
                                paid_at = coalesce($4, paid_at), fees = coalesce($5, fees),
                                failure_reason = coalesce($6, failure_reason), checked_at = now()
      where id = $1 returning *`,
    [id, status, providerRef ?? null, paidAt ?? null, fees ?? null, failureReason ?? null],
  )
  return rows[0]
}

/* ---------- Paiement en ligne (prestataire) ---------- */

/** Commande par son numéro, verrouillée (lancement d'un paiement) */
export async function lockOrderByNumber(db, number) {
  const { rows } = await db.query(`select * from public.orders where number = $1 for update`, [number])
  return rows[0] ?? null
}

export async function findOrderByNumber(number) {
  const { rows } = await query(`select * from public.orders where number = $1`, [number])
  return rows[0] ?? null
}

/** Dernier paiement en attente de la commande (la tentative en cours ou à lancer), verrouillé */
export async function lockPendingPayment(db, orderId) {
  const { rows } = await db.query(
    `select * from public.payments
      where order_id = $1 and kind = 'paiement' and status = 'en_attente'
      order by created_at desc limit 1 for update`,
    [orderId],
  )
  return rows[0] ?? null
}

/** Paiements (pas les remboursements) d'une commande, du plus récent au plus ancien */
export async function findOrderPayments(orderId) {
  const { rows } = await query(
    `select * from public.payments where order_id = $1 and kind = 'paiement' order by created_at desc`,
    [orderId],
  )
  return rows
}

/** Tentative lancée : référence envoyée au prestataire, délai de validation */
export async function markStarted(db, id, { reference, provider, payerPhone, expiresAt }) {
  const { rows } = await db.query(
    `update public.payments set reference = $2, provider = coalesce($3, provider), payer_phone = coalesce($4, payer_phone),
                                started_at = now(), expires_at = $5, failure_reason = null
      where id = $1 returning *`,
    [id, reference, provider ?? null, payerPhone ?? null, expiresAt],
  )
  return rows[0]
}

/** Réponse du prestataire à la demande : son numéro de transaction, ses frais, la page de paiement (carte) */
export async function saveStartResult(db, id, { providerTxId, fees, paymentPage }) {
  const { rows } = await db.query(
    `update public.payments set provider_tx_id = coalesce($2, provider_tx_id), fees = coalesce($3, fees),
                                payment_page = coalesce($4, payment_page), checked_at = now()
      where id = $1 returning *`,
    [id, providerTxId ?? null, fees ?? null, paymentPage ?? null],
  )
  return rows[0]
}

export async function touchChecked(id) {
  await query(`update public.payments set checked_at = now() where id = $1`, [id])
}

/** Journal du paiement (sans les clés du prestataire) */
export async function insertEvent(db, { paymentId, source, status = null, payload = null }) {
  await (db ?? { query }).query(
    `insert into public.payment_events (payment_id, source, status, payload) values ($1, $2, $3, $4)`,
    [paymentId, source, status, payload == null ? null : JSON.stringify(payload)],
  )
}

/** Paiement visé par un message du prestataire : par notre référence, sinon par son numéro de transaction */
export async function findByProviderIds({ reference, providerTxId }) {
  const { rows } = await query(
    `select pay.*, o.number as order_number from public.payments pay join public.orders o on o.id = pay.order_id
      where ($1::text is not null and pay.reference = $1) or ($2::text is not null and pay.provider_tx_id = $2)
      order by pay.created_at desc limit 1`,
    [reference ?? null, providerTxId ?? null],
  )
  return rows[0] ?? null
}

/** Paiements lancés encore en attente, pas revérifiés depuis `seconds` (filet de sécurité) */
export async function findPendingToCheck(seconds = 45, limit = 25) {
  const { rows } = await query(
    `select pay.* from public.payments pay
      where pay.kind = 'paiement' and pay.status = 'en_attente' and pay.started_at is not null
        and (pay.checked_at is null or pay.checked_at < now() - make_interval(secs => $1))
      order by pay.started_at limit $2`,
    [seconds, limit],
  )
  return rows
}

export async function insertHistory(db, { orderId, from, to, by, reason }) {
  await db.query(
    `insert into public.order_status_history (order_id, from_status, to_status, changed_by, reason)
     values ($1, $2, $3, $4, $5)`,
    [orderId, from, to, by, reason ?? null],
  )
}

export async function findPayments({ status, kind, limit, offset, q }) {
  const { rows } = await query(
    `select pay.id, pay.kind, pay.method, pay.provider, pay.amount, pay.currency, pay.status, pay.provider_ref,
            pay.payer_phone, pay.paid_at, pay.created_at,
            pay.reference, pay.provider_tx_id, pay.fees, pay.failure_reason, pay.started_at, pay.expires_at, pay.checked_at,
            (select e.status from public.payment_events e where e.payment_id = pay.id and e.status is not null
              order by e.created_at desc limit 1) as provider_status,
            o.id as order_id, o.number as order_number, o.status as order_status, o.customer_name, o.customer_phone,
            p.brand_id as refund_brand_id, b.name as refund_brand,
            count(*) over () as total
       from public.payments pay
       join public.orders o on o.id = pay.order_id
       left join public.order_parts p on p.id = pay.order_part_id
       left join public.brands b on b.id = p.brand_id
      where ($1::public.payment_status is null or pay.status = $1)
        and ($2::public.payment_kind is null or pay.kind = $2)
        and ($5::text is null or o.number ilike '%' || $5 || '%' or pay.reference ilike '%' || $5 || '%'
             or pay.provider_tx_id = $5 or pay.provider_ref = $5 or o.customer_name ilike '%' || $5 || '%')
      order by pay.created_at desc
      limit $3 offset $4`,
    [status ?? null, kind ?? null, limit, offset, q?.trim() || null],
  )
  return rows
}

/** Montant dû par la commande (0 si annulée ou refusée) */
export async function orderDue(db, orderId) {
  const { rows } = await db.query(
    `select status, total, adjusted_total from public.orders where id = $1`,
    [orderId],
  )
  const o = rows[0]
  if (!o || ['annulee', 'refusee'].includes(o.status)) return 0
  return Number(o.adjusted_total) > 0 ? Number(o.adjusted_total) : Number(o.total)
}

/** Tentatives de paiement pas encore lancées (créées pour réessayer) : annulées, la commande est payée */
export async function cancelUnstartedPayments(db, orderId) {
  await db.query(
    `update public.payments set status = 'annule'
      where order_id = $1 and kind = 'paiement' and status = 'en_attente' and started_at is null`,
    [orderId],
  )
}

export async function hasPaidPayment(db, orderId) {
  const { rows } = await db.query(
    `select 1 from public.payments where order_id = $1 and kind = 'paiement' and status = 'paye' limit 1`,
    [orderId],
  )
  return rows.length > 0
}
