import { transaction } from '../../config/db.js'
import { events } from '../../shared/events.js'
import { badRequest, conflict, forbidden, notFound } from '../../shared/errors.js'
import { multiply, sum } from '../../shared/money.js'
import * as payments from '../payments/payments.service.js'
import * as model from './orders.model.js'
import { forBrand, forCustomer, presentOrder } from './orders.present.js'
import { computeOrderState, customerCanCancel, tabOf } from './orders.status.js'

// Règles métier des commandes.

export const DELIVERY_FEE = 4 // Gombe, le jour même (autres communes à définir)

export const TAB_STATUSES = {
  en_attente: ['en_attente'],
  en_cours: ['en_cours', 'prete_retrait', 'en_livraison'],
  refusees: ['refusee', 'annulee'],
  terminees: ['livree', 'retiree'],
}

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Passer une commande (client connecté ou sans compte).
 * Prix et stock viennent de la base, jamais du navigateur. Tout est enregistré ensemble ou rien.
 * Maison fermée (« bientôt disponible ») : refusé. Vente au kilo : stock en kg sur le produit.
 */
export async function placeOrder(user, data) {
  // Une même variante peut apparaître deux fois (deux mots cadeau) : on additionne pour le stock
  const wanted = new Map()
  for (const item of data.items) wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + item.quantity)

  const order = await transaction(async (db) => {
    const variants = new Map((await model.lockVariants(db, [...wanted.keys()])).map((v) => [v.id, v]))
    const kgProducts = [...new Set([...variants.values()].filter((v) => v.unit === 'kg').map((v) => v.product_id))]
    const stockKg = await model.lockKgStock(db, kgProducts)

    // Grammes demandés par produit vendu au kilo (plusieurs variantes partagent le même stock)
    const gramsWanted = new Map()
    for (const [id, qty] of wanted) {
      const v = variants.get(id)
      if (v?.unit === 'kg') gramsWanted.set(v.product_id, (gramsWanted.get(v.product_id) ?? 0) + (v.weight_grams ?? 0) * qty)
    }

    // Contrôles : tout est vérifié avant d'écrire quoi que ce soit
    const problems = []
    for (const [id, qty] of wanted) {
      const v = variants.get(id)
      if (!v || !v.active) problems.push({ variantId: id, code: 'UNAVAILABLE', message: 'Article indisponible' })
      else if (!v.brand_open) problems.push({ variantId: id, code: 'COMING_SOON', message: `Bientôt disponible : ${v.name_fr}` })
      else if (v.price == null) problems.push({ variantId: id, code: 'NO_PRICE', message: `Prix à venir : ${v.name_fr}` })
      else if (v.unit === 'kg') {
        const available = stockKg.get(v.product_id) ?? 0
        if (!v.weight_grams || gramsWanted.get(v.product_id) > available * 1000)
          problems.push({ variantId: id, code: 'OUT_OF_STOCK', message: `Stock insuffisant : ${v.name_fr} (${available} kg disponible(s))`, availableKg: available })
      } else if (v.stock < qty)
        problems.push({ variantId: id, code: 'OUT_OF_STOCK', message: `Stock insuffisant : ${v.name_fr} (${v.stock} disponible(s))`, available: v.stock })
    }
    if (problems.length) throw conflict('CART_INVALID', 'Certains articles ne peuvent pas être commandés', problems)

    // Une part par Maison
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
    for (const [id, qty] of wanted) {
      const v = variants.get(id)
      if (v.unit !== 'kg') await model.decrementVariantStock(db, id, qty)
    }
    for (const [productId, grams] of gramsWanted) await model.decrementKgStock(db, productId, grams / 1000)

    await payments.createPending(db, {
      orderId: created.id,
      method: data.paymentMethod,
      provider: data.provider ?? null,
      amount: total,
      payerPhone: data.payerPhone ?? null,
    })
    await model.insertHistory(db, { orderId: created.id, to: 'en_attente', by: user?.id ?? null })

    return { ...created, total }
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
 * Recalcule le statut global d'une commande à partir de ses parts (dans la transaction en cours).
 * Retourne l'état avant/après, pour l'historique et les notifications.
 */
export async function recomputeOrder(db, orderId, by = null) {
  const order = await model.lockOrder(db, orderId)
  const parts = await model.findParts(db, orderId)
  const state = computeOrderState(order, parts)
  await model.setOrderState(db, orderId, { status: state.status, adjustedTotal: state.adjustedTotal, isPartial: state.isPartial })
  if (state.status !== order.status) await model.insertHistory(db, { orderId, from: order.status, to: state.status, by })
  return { before: order, after: { ...order, status: state.status, adjusted_total: state.adjustedTotal, is_partial: state.isPartial }, parts }
}

/** Une commande en forme dashboard (ou null) */
export async function loadOrder(id) {
  const row = await model.findOrderRow(id)
  return row ? presentOrder(row) : null
}

/**
 * Voir une commande. Client, livreur assigné et super-admin voient tout ;
 * un employé ne voit que la part de sa Maison ; les autres reçoivent « introuvable ».
 */
export async function getOrder(user, id) {
  const order = await loadOrder(id)
  if (!order) throw notFound('Commande')

  const isAdmin = user.has('super_admin')
  const isCustomer = order.customerId === user.id
  const isRider = order.riderId != null && (await isRiderProfile(order, user))
  const ownParts = order.parts.filter((p) => user.brandIds.includes(p.brandId))

  if (isAdmin || isCustomer || isRider)
    return { ...order, canCancel: isCustomer && customerCanCancel({ status: order.status, is_partial: order.partial }) }
  if (ownParts.length) return forBrand(order, user.brandIds)
  throw notFound('Commande')
}

async function isRiderProfile(order, user) {
  if (!user.has('livreur')) return false
  const row = await model.findOrderRow(order.id)
  return row?.delivery?.rider_profile_id === user.id
}

/** « Mes commandes » (dashboard client), filtrables par onglet */
export async function listMyOrders(user, tab) {
  const rows = await model.findByCustomer(user.id, tab ? TAB_STATUSES[tab] : null)
  return rows.map((o) => ({ ...o, tab: tabOf(o.status) }))
}

/** Toutes les commandes (super-admin), forme dashboard */
export async function listAll({ tab, search, date, limit, offset }) {
  const rows = await model.findOrderRows({
    statuses: tab ? TAB_STATUSES[tab] : null,
    since: date === 'today' ? startOfToday() : null,
    search: search || null,
    limit,
    offset,
  })
  return { total: Number(rows[0]?.total_count ?? 0), limit, offset, items: rows.map(presentOrder) }
}

/** Suivi public d'une commande (sans compte) : numéro + téléphone de la commande */
export async function track(number, phone) {
  const row = await model.findOrderRowByNumber(number.toUpperCase())
  const digits = (s) => String(s ?? '').replace(/\D/g, '')
  const a = digits(row?.customer_phone)
  const b = digits(phone)
  // Les 9 derniers chiffres suffisent (avec ou sans +243 / 0)
  if (!row || b.length < 8 || a.slice(-9) !== b.slice(-9)) throw notFound('Commande')
  return forCustomer(presentOrder(row))
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
      await model.setPartState(db, p.id, { status: 'annulee' })
      await model.insertHistory(db, { orderId: id, partId: p.id, from: p.status, to: 'annulee', by: user.id, reason })
      cancelled.push(p.brand_id)
    }
    await model.setOrderState(db, id, { status: 'annulee', adjustedTotal: 0 })
    await model.insertHistory(db, { orderId: id, from: order.status, to: 'annulee', by: user.id, reason })
    const refund = await payments.settleCancellation(db, { orderId: id, method: order.payment_method })

    return { number: order.number, cancelledBrands: cancelled, refund: refund ? Number(refund.amount) : 0 }
  })

  events.emit('order.cancelled', { orderId: id, by: user.has('super_admin') ? 'admin' : 'client', reason, ...result })
  return { id, number: result.number, status: 'annulee', tab: tabOf('annulee'), refund: result.refund }
}

/**
 * Retrait en boutique : le client récupère sa commande au point de retrait.
 * Super-admin ou employé de la Maison du point de retrait. Toutes les parts actives doivent être prêtes.
 */
export async function handover(user, id) {
  await transaction(async (db) => {
    const order = await model.lockOrder(db, id)
    if (!order) throw notFound('Commande')
    if (!user.has('super_admin') && !user.brandIds.includes(order.pickup_brand_id)) throw notFound('Commande')
    if (order.mode !== 'retrait') throw conflict('NOT_A_PICKUP', 'Cette commande est en livraison, pas en retrait')
    if (['livree', 'retiree', 'refusee', 'annulee'].includes(order.status)) throw conflict('ORDER_CLOSED', 'Cette commande est déjà close')

    const active = (await model.findParts(db, id)).filter((p) => p.status !== 'refusee' && p.status !== 'annulee')
    const notReady = active.filter((p) => p.status !== 'prete' && p.status !== 'collectee')
    if (notReady.length) throw conflict('PARTS_NOT_READY', `Pas encore prête : ${notReady.map((p) => p.brand_name).join(', ')}`)

    for (const p of active.filter((x) => x.status === 'prete')) {
      await model.setPartState(db, p.id, { status: 'collectee' })
      await model.insertHistory(db, { orderId: id, partId: p.id, from: 'prete', to: 'collectee', by: user.id })
    }
    await model.setOrderState(db, id, { status: 'retiree' })
    await model.insertHistory(db, { orderId: id, from: order.status, to: 'retiree', by: user.id })
  })
  events.emit('order.picked_up', { orderId: id })
  return loadOrder(id)
}
