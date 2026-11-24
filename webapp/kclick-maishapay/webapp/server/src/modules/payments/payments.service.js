import { randomBytes } from 'node:crypto'
import { transaction } from '../../config/db.js'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { events } from '../../shared/events.js'
import { conflict, notFound } from '../../shared/errors.js'
import * as model from './payments.model.js'
import { providers } from './providers/index.js'
import { redact, walletId } from './providers/maishapay.js'

// Paiements : mobile money et carte uniquement (pas de paiement à la livraison).
// Prestataire : MaishaPay (providers/). Sans clés MaishaPay, l'équipe confirme les paiements à la main (super-admin).
//
// Une ligne de `payments` = une tentative. Elle est lancée chez le prestataire (startPayment), puis réglée
// (settle) quand son état réel est connu : JAMAIS sur la seule foi d'un message reçu, toujours après
// vérification auprès du prestataire (verifyPayment). Une tentative échouée laisse une nouvelle ligne
// « en_attente » pour réessayer. Chaque étape est écrite dans payment_events (sans les clés).

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

/** La commande est-elle payée ? (au moins un paiement confirmé) */
export const isPaid = (db, orderId) => model.hasPaidPayment(db, orderId)

/** Paiement en ligne actif pour ce moyen de paiement (sinon : confirmation à la main) */
export const isOnlineMethod = (method) => Boolean(providers[method]?.isEnabled?.())

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

/* ---------- Paiement en ligne (MaishaPay) ---------- */

const last9 = (s) => String(s ?? '').replace(/\D/g, '').slice(-9)
const phoneMatches = (order, phone) => last9(phone).length === 9 && last9(order.customer_phone) === last9(phone)
const isOnline = (method) => Boolean(providers[method]?.isEnabled?.())
const isExpired = (p) => Boolean(p.expires_at) && new Date(p.expires_at) <= new Date()
const timeoutMs = () => env.PAYMENT_TIMEOUT_MINUTES * 60_000

/** Notre référence unique pour le prestataire : KC-00012-7F3Q9A */
const newReference = (number) => `${number}-${randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`

// Motif d'échec lisible par le client
function failureText(result) {
  const s = String(result.rawStatus ?? '').trim().toUpperCase()
  if (s === 'EXPIRED') return 'Délai de validation dépassé'
  if (s === 'CANCELED' || s === 'CANCELLED') return 'Paiement annulé'
  if (s === 'DECLINED' || s === 'REJECTED') return 'Paiement refusé par l’opérateur'
  return result.message || 'Le paiement n’a pas abouti'
}

const logEvent = (paymentId, source, status, payload) =>
  model.insertEvent(null, { paymentId, source, status: status ? String(status).trim() : null, payload: redact(payload) }).catch((err) =>
    logger.warn({ err: err.message, paymentId }, 'Journal du paiement non écrit'),
  )

/**
 * Règle une tentative d'après son état RÉEL (vérifié auprès du prestataire). Sans effet si déjà réglée.
 * Payé après coup (après expiration ou annulation de la commande) : enregistré quand même, et le trop-perçu
 * part en remboursement pour l'équipe.
 */
export async function settle(paymentId, result, source = 'verification') {
  const outcome = await transaction(async (db) => {
    const p = await model.lockPayment(db, paymentId)
    if (!p || p.kind !== 'paiement') return null

    if (result.status === 'paye' && p.status !== 'paye') {
      const ref = result.providerTxId ?? p.provider_tx_id ?? p.reference
      const updated = await model.updatePayment(db, p.id, { status: 'paye', providerRef: ref, paidAt: new Date(), fees: result.fees })
      await model.cancelUnstartedPayments(db, p.order_id)
      await model.insertHistory(db, { orderId: p.order_id, from: `paiement ${p.status}`, to: 'paiement paye', by: null, reason: `MaishaPay ${ref}` })
      // Trop-perçu (commande annulée entre-temps, ou payée deux fois) → remboursement à faire
      const excess = Math.round(((await model.paidBalance(db, p.order_id)) - (await model.orderDue(db, p.order_id))) * 100) / 100
      const refund = excess > 0 ? await model.insertPayment(db, { orderId: p.order_id, kind: 'remboursement', method: p.method, amount: excess }) : null
      return { payment: { ...updated, order_number: p.order_number }, changed: 'paye', refund }
    }

    if (result.status === 'echoue' && p.status === 'en_attente') {
      const reason = failureText(result)
      const updated = await model.updatePayment(db, p.id, { status: 'echoue', failureReason: reason, fees: result.fees })
      // Nouvelle tentative prête : le client peut réessayer sur la même commande
      if (!['annulee', 'refusee', 'livree', 'retiree'].includes(p.order_status))
        await model.insertPayment(db, { orderId: p.order_id, method: p.method, provider: p.provider, amount: p.amount, payerPhone: p.payer_phone })
      await model.insertHistory(db, { orderId: p.order_id, from: 'paiement en_attente', to: 'paiement echoue', by: null, reason })
      return { payment: { ...updated, order_number: p.order_number }, changed: 'echoue', reason }
    }

    return { payment: { ...p }, changed: false }
  })

  if (outcome?.changed) await logEvent(paymentId, source === 'expiration' ? 'expiration' : 'verification', result.rawStatus, { settled: outcome.changed })
  if (outcome?.changed === 'paye') events.emit('payment.confirmed', { orderId: outcome.payment.order_id, paymentId, amount: outcome.payment.amount })
  if (outcome?.changed === 'echoue') events.emit('payment.failed', { orderId: outcome.payment.order_id, paymentId, reason: outcome.reason })
  return outcome
}

/** Demande au prestataire l'état réel d'une tentative lancée, puis la règle */
export async function verifyPayment(p) {
  const impl = providers[p.method]
  if (!impl?.isEnabled?.() || !p.started_at) return null
  let result
  try {
    result = await impl.verify(p)
  } catch (err) {
    await model.touchChecked(p.id)
    await logEvent(p.id, 'erreur', err.code, { message: err.message })
    return null
  }
  await logEvent(p.id, 'verification', result.rawStatus, result.payload)
  if (result.status === 'en_attente') {
    if (p.status === 'en_attente' && isExpired(p))
      return settle(p.id, { status: 'echoue', rawStatus: 'EXPIRED', message: 'Délai de validation dépassé' }, 'expiration')
    await model.touchChecked(p.id)
    return null
  }
  return settle(p.id, result)
}

/**
 * Lance (ou relance) le paiement d'une commande chez le prestataire.
 * Accès comme le suivi sans compte : numéro de commande + téléphone de la commande.
 * Une demande déjà en cours n'est pas renvoyée (double clic, rechargement) ; avec un autre numéro
 * ou un autre opérateur, la demande en cours est remplacée.
 */
export async function startPayment({ number, phone, provider, payerPhone }) {
  const prep = await transaction(async (db) => {
    const order = await model.lockOrderByNumber(db, number)
    if (!order || !phoneMatches(order, phone)) throw notFound('Commande')
    if (['annulee', 'refusee'].includes(order.status)) throw conflict('ORDER_CLOSED', 'Cette commande est annulée')
    const p = await model.lockPendingPayment(db, order.id)
    if (!p) {
      if ((await model.paidBalance(db, order.id)) > 0) throw conflict('ALREADY_PAID', 'Cette commande est déjà payée')
      throw conflict('NO_PENDING_PAYMENT', 'Aucun paiement à faire pour cette commande')
    }
    if (!isOnline(p.method)) return { order, payment: p, manual: true }

    const changed = (provider && provider !== p.provider) || (payerPhone && walletId(payerPhone) !== walletId(p.payer_phone))
    if (p.started_at && !isExpired(p) && !changed) return { order, payment: p, already: true }

    let target = p
    if (p.started_at) {
      // Tentative précédente expirée ou remplacée : elle est close, une nouvelle part chez le prestataire
      await model.updatePayment(db, p.id, { status: 'echoue', failureReason: isExpired(p) ? 'Délai de validation dépassé' : 'Remplacé par une nouvelle demande' })
      target = await model.insertPayment(db, { orderId: order.id, method: p.method, provider: p.provider, amount: p.amount, payerPhone: p.payer_phone })
    }
    const started = await model.markStarted(db, target.id, {
      reference: newReference(order.number),
      provider: p.method === 'mobile_money' ? provider : null,
      payerPhone: p.method === 'mobile_money' && payerPhone ? walletId(payerPhone) : null,
      expiresAt: new Date(Date.now() + timeoutMs()),
    })
    return { order, payment: started }
  })

  const { order, payment } = prep
  if (prep.manual || prep.already) return paymentStatus({ number: order.number, phone })

  // Appel au prestataire, en dehors de la transaction
  let result
  try {
    result = await providers[payment.method].start({ order, payment })
  } catch (err) {
    await logEvent(payment.id, 'erreur', err.code, { message: err.message })
    await settle(payment.id, { status: 'echoue', rawStatus: err.code, message: err.message }, 'demande')
    return paymentStatus({ number: order.number, phone })
  }
  await logEvent(payment.id, 'demande', null, result.request)
  await logEvent(payment.id, 'reponse', result.rawStatus, result.payload)

  // Réponse directe de MaishaPay à notre appel : fiable (ce n'est pas un message reçu)
  if (result.status === 'en_attente') await transaction((db) => model.saveStartResult(db, payment.id, result))
  else {
    await transaction((db) => model.saveStartResult(db, payment.id, result))
    await settle(payment.id, result, 'demande')
  }
  return paymentStatus({ number: order.number, phone })
}

/**
 * Où en est le paiement de la commande ? (le site interroge toutes les 3 s pendant l'attente)
 * Une tentative en attente pas vérifiée depuis 8 s est revérifiée auprès du prestataire.
 */
export async function paymentStatus({ number, phone }) {
  const order = await model.findOrderByNumber(number)
  if (!order || !phoneMatches(order, phone)) throw notFound('Commande')

  let list = await model.findOrderPayments(order.id)
  const started = (ps) => ps.find((p) => p.started_at || p.status !== 'en_attente')
  const current = started(list)
  if (current?.status === 'en_attente' && current.started_at && (!current.checked_at || Date.now() - new Date(current.checked_at) > 8000)) {
    await verifyPayment(current)
    list = await model.findOrderPayments(order.id)
  }

  const paid = list.find((p) => p.status === 'paye')
  const attempt = paid ?? started(list) ?? list[0]
  const closed = ['annulee', 'refusee'].includes(order.status)
  const waiting = attempt?.status === 'en_attente' && Boolean(attempt.started_at) && !isExpired(attempt)
  const masked = (ph) => (ph ? String(ph).replace(/\D/g, '').replace(/^(\d{3})(\d+)(\d{2})$/, (_, a, b, c) => `+${a} ${'•'.repeat(b.length)}${c}`) : null)

  return {
    number: order.number,
    amount: Number(order.adjusted_total) > 0 ? Number(order.adjusted_total) : Number(order.total),
    currency: attempt?.currency ?? 'USD',
    method: attempt?.method ?? order.payment_method,
    online: isOnline(attempt?.method ?? order.payment_method),
    status: paid ? 'paye' : attempt?.status === 'en_attente' && !attempt.started_at ? 'a_payer' : attempt?.status ?? 'a_payer',
    waiting, // demande envoyée, en attente de validation par le client
    provider: attempt?.provider ?? null,
    payerPhone: masked(attempt?.payer_phone),
    paymentPage: waiting && attempt.method === 'carte' ? attempt.payment_page : null,
    expiresAt: waiting ? attempt.expires_at : null,
    failureReason: !paid && attempt?.status === 'echoue' ? attempt.failure_reason : null,
    canRetry: !paid && !closed && list.some((p) => p.status === 'en_attente' && (!p.started_at || isExpired(p))),
    paidAt: paid?.paid_at ?? null,
  }
}

/**
 * Message de MaishaPay : POST (mobile money, corps JSON) ou GET (carte, paramètres d'adresse).
 * Non signé : on retrouve la tentative, on écrit le message au journal, puis on vérifie auprès de MaishaPay.
 * Renvoie le numéro de commande (la carte y renvoie le client, sur le suivi).
 */
export async function webhook(_providerName, req) {
  const b = req.method === 'GET' ? {} : (req.body ?? {})
  const q = req.query ?? {}
  const ids = {
    reference: b.originatingTransactionId ?? b.transactionReference ?? q.transactionRefId ?? null,
    providerTxId: b.transactionId != null ? String(b.transactionId) : (q.operatorRefId ?? null),
  }
  if (!ids.reference && !ids.providerTxId) return { ok: false, orderNumber: null }
  const p = await model.findByProviderIds(ids)
  if (!p) {
    logger.warn(ids, 'Message MaishaPay pour un paiement inconnu')
    return { ok: false, orderNumber: null }
  }
  await logEvent(p.id, 'notification', b.transactionStatus ?? q.description ?? null, { ...b, ...q })
  await verifyPayment(p) // ne règle que si MaishaPay confirme
  return { ok: true, orderNumber: p.order_number }
}

/* ---------- Filet de sécurité : revérifie les paiements en attente toutes les minutes ---------- */

let sweepTimer = null
let sweeping = false

export async function sweepPending() {
  if (sweeping) return
  sweeping = true
  try {
    for (const p of await model.findPendingToCheck(45)) await verifyPayment(p)
  } catch (err) {
    logger.warn({ err: err.message }, 'Vérification des paiements en attente impossible')
  } finally {
    sweeping = false
  }
}

export function startPaymentWorker(intervalMs = 60_000) {
  if (sweepTimer || !Object.values(providers).some((impl) => impl.isEnabled?.())) return
  sweepTimer = setInterval(sweepPending, intervalMs)
  sweepTimer.unref?.()
}

export function stopPaymentWorker() {
  clearInterval(sweepTimer)
  sweepTimer = null
}
