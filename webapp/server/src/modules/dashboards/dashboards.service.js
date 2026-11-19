import * as orders from '../orders/orders.model.js'
import { presentOrder } from '../orders/orders.present.js'
import { DISPLAY_STATUSES } from '../orders/orders.status.js'
import { riders as listRiders } from '../deliveries/deliveries.service.js'
import { sum } from '../../shared/money.js'
import * as model from './dashboards.model.js'

// Vue d'ensemble du super-admin (même contenu que l'écran « Vue d’ensemble » de la maquette)

const LATE_MINUTES = 20

export async function admin() {
  const since = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const today = (await orders.findOrderRows({ since, limit: 500 })).map(presentOrder)
  const now = Date.now()

  const byStatus = Object.fromEntries(DISPLAY_STATUSES.map((s) => [s, 0]))
  for (const o of today) byStatus[o.displayStatus] += 1

  const open = today.filter((o) => !['livree', 'annulee'].includes(o.displayStatus))
  const alerts = []
  for (const o of today)
    for (const p of o.parts) {
      if (p.status === 'en_preparation' && p.startedAt && now - new Date(p.startedAt) > LATE_MINUTES * 60000)
        alerts.push({ type: 'late', level: 'warning', orderId: o.id, number: o.number, brand: p.brand, minutes: Math.round((now - new Date(p.startedAt)) / 60000),
                      title: `${o.number} en préparation depuis ${Math.round((now - new Date(p.startedAt)) / 60000)} min`, text: `La part ${p.brandName} n’est pas encore prête.` })
      if (p.status === 'refusee')
        alerts.push({ type: 'refused', level: 'danger', orderId: o.id, number: o.number, brand: p.brand,
                      title: `Rupture signalée chez ${p.brandName}`, text: `${o.number} : ${p.refusal ?? 'motif non précisé'}` })
    }
  for (const p of await model.outOfStock())
    alerts.push({ type: 'stock', level: 'danger', brand: p.brand, ref: p.ref,
                  title: `Rupture chez ${p.brand_name}`, text: `${p.name_fr}${p.ref ? ` (${p.ref})` : ''} : ${p.unit === 'kg' ? `${Number(p.stock_kg ?? 0)} kg` : 'stock à 0'}.` })

  return {
    date: since,
    kpis: {
      ordersToday: today.length,
      revenue: sum(today.filter((o) => !o.cancelled).map((o) => o.adjustedTotal)),
      inProgress: open.length,
      toAssign: today.filter((o) => o.dispatchable).length,
      averageDeliveryMinutes: await model.averageDeliveryMinutes(since),
    },
    byStatus,
    salesByBrand: (await model.salesByBrand(since)).map((b) => ({ brand: b.brand, name: b.name, color: b.color, isOpen: b.is_open, amount: Number(b.amount), parts: b.parts })),
    alerts,
    riders: await listRiders(),
    latest: today.slice(0, 8),
  }
}
