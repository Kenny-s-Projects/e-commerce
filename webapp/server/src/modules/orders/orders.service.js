import { transaction } from '../../config/db.js'
import { events } from '../../shared/events.js'
import { badRequest, conflict, forbidden, notFound } from '../../shared/errors.js'
import { multiply, sum } from '../../shared/money.js'
import * as payments from '../payments/payments.service.js'
import * as model from './orders.model.js'
import { customerCanCancel, tabOf } from './orders.status.js'

// Règles métier des commandes.

export const DELIVERY_FEE = 4 // Gombe, le jour même (autres communes à définir)

const TAB_STATUSES = {
  en_attente: ['en_attente'],
  en_cours: ['en_cours', 'prete_retrait', 'en_livraison'],
  refusees: ['refusee', 'annulee'],
  terminees: ['livree', 'retiree'],
}

/**
 * Passer une commande (client connecté ou sans compte).
 * Les prix et le stock viennent de la base, jamais du navigateur. Tout est enregistré ensemble ou rien.
 */
export async function placeOrder(user, data) {
  // Une même variante peut apparaître deux fois dans le panier (deux mots cadeau différents) : on additionne pour le stock
  const wanted = new Map()
  for (const item of data.items) wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + item.quantity)

  const order = await transaction(async (db) => {
    const variants = new Map((await model.lockVariants(db, [...wanted.keys()])).map((v) => [v.id, v]))

    // Contrôles : tout est vérifié avant d'écrire quoi que ce soit
    const problems = []
    for (const [id, qty] of wanted) {
      const v = variants.get(id)
      if (!v || !v.active) problems.push({ variantId: id, code: 'UNAVAILABLE', message: 'Article indisponible' })
      else if (v.price == null) problems.push({ variantId: id, code: 'NO_PRICE', message: `Prix à venir : ${v.name_fr}` })
      else if (v.stock < qty)
        problems.push({ variantId: id, code: 'OUT_OF_STOCK', message: `Stock insuffisant : ${v.name_fr} (${v.stock} disponible(s))`, available: v.stock })
    }
    if (problems.length) throw conflict('CART_INVALID', 'Certains articles ne peuvent pas être commandés', problems)

    // Une part par brand
    const byBrand = new Map()
    for (const item of data.items) {
      const v = variants.get(item.variantId)
      const lines = byBrand.get(v.brand_id) ?? []
      lines.push({ ...item, variant: v, lineTotal: multiply(v.price, item.quantity) })
      byBrand.set(v.brand_id, lines)
    }

    const subtotal = sum(data.items.map((i) => multiply(variants.get(i.variantId).price, i.quantity)))
    const deliveryFee = data.mode === 'livraison' ? DELIVERY_FEE : 0
    const total = sum([subtotal, deliveryFee])
    const pickup = data.mode === 'retrait' ? await model.findPickupBrand(db) : null
    if (data.mode === 'retrait' && !pickup) throw badRequest('NO_PICKUP_POINT', 'Aucun point de retrait disponible')

    const created = await model.insertOrder(db, {
      customerId: user?.id ?? null,
      name: data.customer.name,
      phone: data.customer.phone,
      email: data.customer.email ?? null,
      mode: data.mode,
      address: data.mode === 'livraison' ? data.address : null,
      pickupBrandId: pickup?.id ?? null,
      paymentMethod: data.paymentMethod,
      subtotal,
      deliveryFee,
      total,
      note: data.note ?? null,
    })

    for (const [brandId, lines] of byBrand) {
      const partId = await model.insertPart(db, { orderId: created.id, brandId, amountDue: sum(lines.map((l) => l.lineTotal)) })
      for (const l of lines)
        await model.insertItem(db, {
          partId,
          variantId: l.variant.id,
          productName: l.variant.name_fr,
          variantLabel: l.variant.label === 'Standard' ? null : l.variant.label,
          unitPrice: l.variant.price,
          quantity: l.quantity,
          giftMessage: l.giftMessage,
        })
    }
    for (const [id, qty] of wanted) await model.decrementStock(db, id, qty)

    await payments.createPending(db, {
      orderId: created.id,
      method: data.paymentMethod,
      provider: data.provider ?? null,
      amount: total,
      payerPhone: data.payerPhone ?? null,
    })
    await model.insertHistory(db, { orderId: created.id, to: 'en_attente', by: user?.id ?? null })

    return { ...created, total, brands: byBrand.size }
  })

  events.emit('order.created', { orderId: order.id })
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    tab: tabOf(order.status),
    total: order.total,
    paymentStatus: 'en_attente',
    createdAt: order.created_at,
  }
}

/**
 * Voir une commande. Le client, le livreur et le super-admin voient tout ;
 * un employé ne voit que la part de sa brand ; les autres reçoivent « introuvable ».
 */
export async function getOrder(user, id) {
  const order = await model.findOrderDetails(id)
  if (!order) throw notFound('Commande')

  const isAdmin = user.has('super_admin')
  const isCustomer = order.customer_id === user.id
  const ownParts = order.parts.filter((p) => user.brandIds.includes(p.brand_id))
  const isRider = !isAdmin && !isCustomer && !ownParts.length && (await model.isRiderOf(id, user.id))

  if (!isAdmin && !isCustomer && !isRider && !ownParts.length) throw notFound('Commande')

  const view = { ...order, tab: tabOf(order.status), canCancel: isCustomer && customerCanCancel(order) }
  if (!isAdmin && !isCustomer && !isRider) {
    // Employé : seulement sa part, sans les paiements de la commande
    return { ...view, parts: ownParts, payments: undefined, history: order.history.filter((h) => !h.order_part_id || ownParts.some((p) => p.id === h.order_part_id)) }
  }
  return view
}

/** « Mes commandes » (dashboard client), filtrables par onglet */
export async function listMyOrders(user, tab) {
  const rows = await model.findByCustomer(user.id, tab ? TAB_STATUSES[tab] : null)
  return rows.map((o) => ({ ...o, tab: tabOf(o.status) }))
}

/**
 * Annuler toute la commande.
 * Client : tant qu'elle est en attente, ou si elle est partielle et pas encore partie en livraison.
 * Super-admin : tant qu'elle n'est pas terminée.
 */
export async function cancelOrder(user, id, reason) {
  const result = await transaction(async (db) => {
    const order = await model.lockOrder(db, id)
    if (!order) throw notFound('Commande')

    const isAdmin = user.has('super_admin')
    if (!isAdmin && order.customer_id !== user.id) throw notFound('Commande')
    if (['livree', 'retiree', 'refusee', 'annulee'].includes(order.status)) throw conflict('ORDER_CLOSED', 'Cette commande est déjà close')
    if (!isAdmin && !customerCanCancel(order)) throw forbidden('Cette commande ne peut plus être annulée')

    const parts = await model.findParts(db, id)
    const cancelled = []
    for (const p of parts.filter((x) => x.status !== 'refusee' && x.status !== 'annulee')) {
      await model.restorePartStock(db, p.id)
      await model.setPartStatus(db, p.id, 'annulee')
      await model.insertHistory(db, { orderId: id, partId: p.id, from: p.status, to: 'annulee', by: user.id, reason })
      cancelled.push(p.brand_id)
    }
    await model.setOrderState(db, id, { status: 'annulee', adjustedTotal: 0 })
    await model.insertHistory(db, { orderId: id, from: order.status, to: 'annulee', by: user.id, reason })
    const refund = await payments.settleCancellation(db, { orderId: id, method: order.payment_method })

    return { number: order.number, cancelledBrands: cancelled, refund: refund ? refund.amount : 0 }
  })

  events.emit('order.cancelled', { orderId: id, by: user.has('super_admin') ? 'admin' : 'client', reason, ...result })
  return { id, number: result.number, status: 'annulee', tab: tabOf('annulee'), refund: result.refund }
}
