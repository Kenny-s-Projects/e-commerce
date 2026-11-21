// Chronologie d'une commande, reconstruite à partir de ses dates (toujours cohérente avec son état)
import { BRANDS } from '../data/demo.js'
import { ORDER_STATUS } from './status.js'
import { tr } from './i18n.js'

const PAYMENT = { mobile_money: 'mobile money', carte: 'carte bancaire' }

export function timeline(order) {
  const events = []
  const add = (at, label, who, color) => at && events.push({ at, label, who, color })
  const rider = order.riderName ? { name: order.riderName } : null

  add(
    order.createdAt,
    order.payment?.status === 'paye' || order.payment?.status === 'rembourse' ? tr('Commande passée et payée en ligne') : tr('Commande passée'),
    `${order.customer.name}, ${tr(PAYMENT[order.payment?.method] ?? 'paiement en attente')}`,
    ORDER_STATUS.nouvelle.bar,
  )
  for (const p of order.parts) {
    const brand = BRANDS[p.brand]?.name ?? p.brandName ?? p.brand
    const who = p.staff ? `${p.staff}, ${brand}` : brand
    add(p.startedAt, tr('Part {brand} en préparation', { brand }), who, ORDER_STATUS.en_preparation.bar)
    add(p.readyAt, tr('Part {brand} prête', { brand }), who, ORDER_STATUS.prete.bar)
    add(p.refusedAt, tr('Part {brand} : rupture', { brand }), p.refusal ? `${who} · ${p.refusal}` : who, ORDER_STATUS.annulee.bar)
    add(p.collectedAt, tr('Part {brand} récupérée', { brand }), rider?.name, ORDER_STATUS.en_route.bar)
  }
  add(order.assignedAt, tr('Livreur assigné'), rider?.name, ORDER_STATUS.assignee.bar)
  add(order.pickedUpAt, tr('En route vers le client'), rider?.name, ORDER_STATUS.en_route.bar)
  add(order.deliveredAt, order.mode === 'retrait' ? tr('Retirée en boutique') : tr('Livrée'), order.mode === 'retrait' ? order.customer.name : rider?.name, ORDER_STATUS.livree.bar)
  add(order.cancelled?.at, tr('Commande annulée'), order.cancelled?.reason, ORDER_STATUS.annulee.bar)

  return events.sort((a, b) => new Date(a.at) - new Date(b.at))
}
