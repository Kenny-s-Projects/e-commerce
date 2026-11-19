import * as model from './payments.model.js'
import { notImplemented } from '../../shared/errors.js'

// Paiements : mobile money et carte uniquement (pas de paiement à la livraison).
// Utilisé par les commandes, dans leur transaction (db = client de transaction).

/** Paiement en attente à la création de la commande (confirmé ensuite par le prestataire ou l'équipe) */
export const createPending = (db, { orderId, method, provider, amount, payerPhone }) =>
  model.insertPayment(db, { orderId, method, provider, amount, payerPhone })

/** Commande annulée : paiements en attente annulés, remboursement créé si de l'argent a déjà été encaissé */
export async function settleCancellation(db, { orderId, method }) {
  await model.cancelPendingPayments(db, orderId)
  const balance = await model.paidBalance(db, orderId)
  if (balance > 0) return model.insertPayment(db, { orderId, kind: 'remboursement', method, amount: balance })
  return null
}

// Routes du module (à écrire au module « payments »)
export async function webhook() { throw notImplemented() }
export async function refunds() { throw notImplemented() }
export async function refundDone() { throw notImplemented() }
