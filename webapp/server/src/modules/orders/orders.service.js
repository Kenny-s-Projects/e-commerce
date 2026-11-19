import { notImplemented } from '../../shared/errors.js'

// Règles métier des commandes. Prochaine étape :
//  - placeOrder(user, data) : prix et stock lus en base, une part par brand, totaux, paiement en attente,
//    historique, puis events.emit('order.created')
//  - cancelOrder(user, id, reason) : customerCanCancel(), stock remis, remboursement si payé
//  - getOrder / listMyOrders
export async function placeOrder() { throw notImplemented() }
export async function cancelOrder() { throw notImplemented() }
export async function getOrder() { throw notImplemented() }
export async function listMyOrders() { throw notImplemented() }
