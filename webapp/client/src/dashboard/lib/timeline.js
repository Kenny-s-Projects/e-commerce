// Chronologie d'une commande, reconstruite à partir de ses dates (toujours cohérente avec son état)
import { BRANDS, RIDERS } from '../data/demo.js'
import { ORDER_STATUS } from './status.js'

const PAYMENT = { mobile_money: 'mobile money', carte: 'carte bancaire' }

export function timeline(order) {
  const events = []
  const add = (at, label, who, color) => at && events.push({ at, label, who, color })
  const rider = RIDERS.find((r) => r.id === order.riderId)

  add(
    order.createdAt,
    order.payment?.status === 'paye' || order.payment?.status === 'rembourse' ? 'Commande passée et payée en ligne' : 'Commande passée',
    `${order.customer.name}, ${PAYMENT[order.payment?.method] ?? 'paiement en attente'}`,
    ORDER_STATUS.nouvelle.bar,
  )
  for (const p of order.parts) {
    const brand = BRANDS[p.brand].name
    const who = p.staff ? `${p.staff}, ${brand}` : brand
    add(p.startedAt, `Part ${brand} en préparation`, who, ORDER_STATUS.en_preparation.bar)
    add(p.readyAt, `Part ${brand} prête`, who, ORDER_STATUS.prete.bar)
    add(p.refusedAt, `Part ${brand} : rupture`, p.refusal ? `${who} · ${p.refusal}` : who, ORDER_STATUS.annulee.bar)
    add(p.collectedAt, `Part ${brand} récupérée`, rider?.name, ORDER_STATUS.en_route.bar)
  }
  add(order.assignedAt, 'Livreur assigné', rider?.name, ORDER_STATUS.assignee.bar)
  add(order.pickedUpAt, 'En route vers le client', rider?.name, ORDER_STATUS.en_route.bar)
  add(order.deliveredAt, order.mode === 'retrait' ? 'Retirée en boutique' : 'Livrée', order.mode === 'retrait' ? order.customer.name : rider?.name, ORDER_STATUS.livree.bar)
  add(order.cancelled?.at, 'Commande annulée', order.cancelled?.reason, ORDER_STATUS.annulee.bar)

  return events.sort((a, b) => new Date(a.at) - new Date(b.at))
}
