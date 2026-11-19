// Paiements : accès aux données (SQL uniquement). Chaque fonction reçoit le client de la transaction en cours.

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
