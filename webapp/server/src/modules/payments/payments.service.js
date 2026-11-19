import { transaction } from '../../config/db.js'
import { events } from '../../shared/events.js'
import { conflict, notFound } from '../../shared/errors.js'
import * as model from './payments.model.js'
import { providers } from './providers/index.js'

// Paiements : mobile money et carte uniquement (pas de paiement à la livraison).
// Tant qu'aucun prestataire n'est branché, l'équipe confirme les paiements à la main (super-admin).

/* ---------- Utilisé par les autres modules, dans leur transaction (db = client de transaction) ---------- */

/** Paiement en attente à la création de la commande */
export const createPending = (db, { orderId, method, provider, amount, payerPhone }) =>
  model.insertPayment(db, { orderId, method, provider, amount, payerPhone })

/** Commande annulée : paiements en attente annulés, remboursement créé si de l'argent a déjà été encaissé */
export async function settleCancellation(db, { orderId, method }) {
  await model.cancelPendingPayments(db, orderId)
  const balance = await model.paidBalance(db, orderId)
  if (balance > 0) return model.insertPayment(db, { orderId, kind: 'remboursement', method, amount: balance })
  return null
}

/**
 * Part d'une brand refusée (commande partielle) :
 *  - pas encore payé : le paiement en attente passe au nouveau total
 *  - déjà payé : remboursement de la part (dans la limite de ce qui a été encaissé)
 */
export async function settlePartRefusal(db, { orderId, partId, method, partAmount, newTotal }) {
  const balance = await model.paidBalance(db, orderId)
  if (balance <= 0) {
    if (newTotal > 0) await model.setPendingAmount(db, orderId, newTotal)
    else await model.cancelPendingPayments(db, orderId)
    return null
  }
  return model.insertPayment(db, { orderId, partId, kind: 'remboursement', method, amount: Math.min(balance, partAmount) })
}

/* ---------- Routes (super-admin) ---------- */

export async function list(filters) {
  const rows = await model.findPayments(filters)
  return { total: Number(rows[0]?.total ?? 0), items: rows.map(({ total: _t, ...r }) => r) }
}

/** Paiement reçu (vérifié par l'équipe sur le relevé mobile money ou carte) */
export async function confirm(user, id, { providerRef, note }) {
  const payment = await transaction(async (db) => {
    const p = await model.lockPayment(db, id)
    if (!p) throw notFound('Paiement')
    if (p.kind !== 'paiement') throw conflict('NOT_A_PAYMENT', 'Ceci est un remboursement : utiliser « remboursement effectué »')
    if (p.status !== 'en_attente') throw conflict('PAYMENT_NOT_PENDING', `Paiement déjà « ${p.status} »`)
    const updated = await model.updatePayment(db, id, { status: 'paye', providerRef, paidAt: new Date() })
    await model.insertHistory(db, { orderId: p.order_id, from: 'paiement en_attente', to: 'paiement paye', by: user.id, reason: note ?? providerRef })
    return { ...updated, order_number: p.order_number }
  })
  events.emit('payment.confirmed', { orderId: payment.order_id, paymentId: payment.id, amount: payment.amount })
  return payment
}

/** Paiement échoué ou refusé par l'opérateur : le client devra repayer (la commande reste en place) */
export async function fail(user, id, { reason }) {
  const payment = await transaction(async (db) => {
    const p = await model.lockPayment(db, id)
    if (!p) throw notFound('Paiement')
    if (p.kind !== 'paiement' || p.status !== 'en_attente') throw conflict('PAYMENT_NOT_PENDING', `Paiement déjà « ${p.status} »`)
    const updated = await model.updatePayment(db, id, { status: 'echoue' })
    // Un nouveau paiement en attente, pour que le client puisse réessayer
    await model.insertPayment(db, { orderId: p.order_id, method: p.method, provider: p.provider, amount: p.amount, payerPhone: p.payer_phone })
    await model.insertHistory(db, { orderId: p.order_id, from: 'paiement en_attente', to: 'paiement echoue', by: user.id, reason })
    return updated
  })
  events.emit('payment.failed', { orderId: payment.order_id, paymentId: payment.id, reason })
  return payment
}

export const refunds = (filters) => list({ ...filters, kind: 'remboursement', status: filters.status ?? 'en_attente' })

/** Remboursement effectué par l'équipe (référence de la transaction de retour) */
export async function refundDone(user, id, { providerRef, note }) {
  const refund = await transaction(async (db) => {
    const p = await model.lockPayment(db, id)
    if (!p) throw notFound('Remboursement')
    if (p.kind !== 'remboursement') throw conflict('NOT_A_REFUND', 'Ceci n’est pas un remboursement')
    if (p.status !== 'en_attente') throw conflict('REFUND_NOT_PENDING', `Remboursement déjà « ${p.status} »`)
    const updated = await model.updatePayment(db, id, { status: 'rembourse', providerRef, paidAt: new Date() })
    await model.insertHistory(db, { orderId: p.order_id, from: 'remboursement en_attente', to: 'remboursement effectue', by: user.id, reason: note ?? providerRef })
    return updated
  })
  events.emit('refund.done', { orderId: refund.order_id, paymentId: refund.id, amount: refund.amount })
  return refund
}

/** Message envoyé par un prestataire (mobile money, carte) : à brancher quand le prestataire est choisi */
export async function webhook(providerName, req) {
  return providers[providerName].verify(req)
}
