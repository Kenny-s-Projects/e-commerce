import { transaction } from '../../config/db.js'
import { events } from '../../shared/events.js'
import { conflict, forbidden, notFound } from '../../shared/errors.js'
import * as orders from '../orders/orders.model.js'
import { presentOrder } from '../orders/orders.present.js'
import * as model from './deliveries.model.js'

// Livraisons à Gombe, le jour même. Paiements en ligne uniquement : le livreur n'encaisse rien.

const CLOSED = ['livree', 'retiree', 'refusee', 'annulee']

export async function riders() {
  const rows = await model.findRiders()
  return rows.map((r) => ({
    id: r.id,
    profileId: r.profile_id,
    name: r.name,
    firstName: (r.name ?? '').split(/\s+/)[0],
    phone: r.phone,
    vehicle: r.vehicle ?? 'Moto',
    zone: r.zone ?? 'Gombe',
    available: r.is_available,
    active: r.is_active,
    status: r.current ? 'en_course' : r.is_available ? 'disponible' : 'hors_ligne',
    current: r.current
      ? { orderId: r.current.order_id, number: r.current.number, eta: r.current.eta_minutes, assignedAt: r.current.assigned_at, pickedUpAt: r.current.picked_up_at, customer: r.current.customer_name }
      : null,
  }))
}

/**
 * Assigner un livreur. Une commande peut partir dès qu'une de ses parts est prête :
 * le livreur passe d'abord chez cette Maison (maquette Dispatch).
 */
export async function assign(user, { orderId, riderId, etaMinutes }) {
  await transaction(async (db) => {
    const order = await orders.lockOrder(db, orderId)
    if (!order) throw notFound('Commande')
    const parts = await orders.findParts(db, orderId)
    if (!user.has('super_admin') && !parts.some((p) => user.brandIds.includes(p.brand_id))) throw notFound('Commande')
    if (order.mode !== 'livraison') throw conflict('NOT_A_DELIVERY', 'Commande en retrait : pas de livreur')
    if (CLOSED.includes(order.status)) throw conflict('ORDER_CLOSED', 'Cette commande est déjà close')
    if (!parts.some((p) => p.status === 'prete')) throw conflict('NO_PART_READY', 'Aucune part n’est encore prête')

    const rider = await model.findRider(db, riderId)
    if (!rider || !rider.is_active) throw notFound('Livreur')

    await model.upsertDelivery(db, { orderId, riderId, assignedBy: user.id, eta: etaMinutes })
    if (order.status === 'en_attente') await orders.setOrderState(db, orderId, { status: 'en_cours' })
    await orders.insertHistory(db, { orderId, from: order.status, to: 'livreur_assigne', by: user.id, reason: rider.name })
  })
  events.emit('delivery.assigned', { orderId, riderId })
  return presentOrder(await orders.findOrderRow(orderId))
}

async function lockAssigned(db, user, orderId) {
  const delivery = await model.lockDelivery(db, orderId)
  if (!delivery) throw notFound('Course')
  if (!user.has('super_admin') && delivery.rider_profile_id !== user.id) throw forbidden('Cette course est assignée à un autre livreur')
  const order = await orders.lockOrder(db, orderId)
  if (CLOSED.includes(order.status)) throw conflict('ORDER_CLOSED', 'Cette commande est déjà close')
  return { delivery, order }
}

/** Le livreur a récupéré la part d'une Maison (elle doit être prête). Tout récupéré → en route. */
export async function collect(user, orderId, brandSlug) {
  const allCollected = await transaction(async (db) => {
    const { order } = await lockAssigned(db, user, orderId)
    const parts = await orders.findParts(db, orderId)
    const part = parts.find((p) => p.brand === brandSlug)
    if (!part) throw notFound('Part')
    if (part.status !== 'prete') throw conflict('PART_NOT_READY', `${part.brand_name} : pas encore prête`)

    await orders.setPartState(db, part.id, { status: 'collectee' })
    await orders.insertHistory(db, { orderId, partId: part.id, from: 'prete', to: 'collectee', by: user.id })

    const active = parts.filter((p) => p.status !== 'refusee' && p.status !== 'annulee')
    const done = active.every((p) => p.id === part.id || p.status === 'collectee')
    if (done) {
      await model.markPickedUp(db, orderId)
      await orders.setOrderState(db, orderId, { status: 'en_livraison' })
      await orders.insertHistory(db, { orderId, from: order.status, to: 'en_livraison', by: user.id })
    }
    return done
  })
  events.emit(allCollected ? 'delivery.picked_up' : 'part.collected', { orderId, brand: brandSlug })
  return presentOrder(await orders.findOrderRow(orderId))
}

/** Commande remise au client (déjà payée en ligne) */
export async function delivered(user, orderId) {
  await transaction(async (db) => {
    const { order } = await lockAssigned(db, user, orderId)
    if (order.status !== 'en_livraison') throw conflict('NOT_ON_THE_WAY', 'Toutes les parts ne sont pas encore récupérées')
    await model.markDelivered(db, orderId)
    await orders.setOrderState(db, orderId, { status: 'livree' })
    await orders.insertHistory(db, { orderId, from: order.status, to: 'livree', by: user.id })
  })
  events.emit('delivery.delivered', { orderId })
  return presentOrder(await orders.findOrderRow(orderId))
}

/** Courses du livreur connecté : en cours, et livrées aujourd'hui */
export async function mine(user) {
  const rider = await model.findRiderByProfile(user.id)
  if (!rider) throw notFound('Livreur')
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const rows = await orders.findOrderRows({ riderProfileId: user.id, limit: 100 })
  const all = rows.map(presentOrder)
  return {
    rider: { id: rider.id, vehicle: rider.vehicle, zone: rider.zone, available: rider.is_available },
    current: all.filter((o) => !o.deliveredAt && !o.cancelled),
    deliveredToday: all.filter((o) => o.deliveredAt && new Date(o.deliveredAt) >= today),
  }
}

export async function availability(user, available) {
  const rider = await model.setAvailability(user.id, available)
  if (!rider) throw notFound('Livreur')
  return { available: rider.is_available }
}
