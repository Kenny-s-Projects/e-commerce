// Mise en forme des commandes pour les dashboards : même forme que les données de démonstration du front
// (client/src/dashboard/data/demo.js), pour que les écrans passent de la démo à l'API sans changement.
import { canDispatch, displayStatus, partDisplayStatus, tabOf } from './orders.status.js'

const iso = (d) => (d ? new Date(d).toISOString() : null)

export function presentPart(p) {
  return {
    id: p.id,
    brand: p.brand,
    brandId: p.brand_id,
    brandName: p.brand_name,
    status: partDisplayStatus(p.status),
    rawStatus: p.status,
    amount: Number(p.amount_due),
    staff: p.staff ?? null,
    items: (p.items ?? []).map((i) => ({
      id: i.id,
      variantId: i.variant_id,
      name: i.product_name,
      detail: i.variant_label ?? null,
      price: Number(i.unit_price),
      qty: i.quantity,
      ref: i.ref ?? null,
      slug: i.product_slug ?? null,
      image: i.image ?? null,
      gift: i.gift_message ?? null,
    })),
    startedAt: iso(p.started_at ?? p.accepted_at),
    readyAt: iso(p.ready_at),
    refusedAt: iso(p.refused_at),
    refusal: p.refusal_reason ?? null,
    collectedAt: iso(p.collected_at),
  }
}

/** Ligne SQL (orders.model.js › ORDER_ROW) → forme dashboard */
export function presentOrder(row) {
  const d = row.delivery
  const pay = row.payment
  const order = {
    id: row.id,
    number: row.number,
    createdAt: iso(row.created_at),
    source: 'site',
    customer: { name: row.customer_name, phone: row.customer_phone, email: row.customer_email ?? null },
    customerId: row.customer_id ?? null,
    mode: row.mode,
    deliveryFee: Number(row.delivery_fee),
    address: row.address_snapshot
      ? { commune: row.address_snapshot.commune ?? '', street: row.address_snapshot.street ?? '', landmark: row.address_snapshot.landmark ?? '', quartier: row.address_snapshot.quartier ?? '' }
      : null,
    pickup: row.pickup_brand ? { brand: row.pickup_brand, name: row.pickup_brand_name, address: row.pickup_address } : null,
    note: row.customer_note ?? null,
    parts: (row.parts ?? []).map(presentPart),
    payment: pay
      ? { method: pay.method, provider: pay.provider ?? null, status: pay.status, at: iso(pay.paid_at ?? pay.created_at), ref: pay.provider_ref ?? null, amount: Number(pay.amount) }
      : null,
    refundPending: Number(row.refund_pending ?? 0),
    riderId: d?.rider_id ?? null,
    riderName: d?.rider_name ?? null,
    assignedAt: iso(d?.assigned_at),
    pickedUpAt: iso(d?.picked_up_at),
    deliveredAt: iso(d?.delivered_at ?? (row.status === 'retiree' ? row.closed_at : null)),
    eta: d?.eta_minutes ?? null,
    cancelled: ['annulee', 'refusee'].includes(row.status)
      ? { reason: row.cancellation?.reason ?? (row.status === 'refusee' ? 'Refusée par la Maison' : null), at: iso(row.cancellation?.created_at ?? row.updated_at) }
      : null,
    partial: row.is_partial,
    status: row.status,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    adjustedTotal: Number(row.adjusted_total),
  }
  order.displayStatus = displayStatus(order)
  order.tab = tabOf(row.status)
  order.dispatchable = canDispatch(order)
  return order
}

/** Vue d'un employé : seulement la part de sa Maison, les autres Maisons citées par leur nom */
export function forBrand(order, brandIds) {
  const own = order.parts.filter((p) => brandIds.includes(p.brandId))
  return {
    ...order,
    parts: own,
    otherBrands: order.parts.filter((p) => !own.includes(p)).map((p) => ({ brand: p.brand, name: p.brandName })),
    payment: order.payment ? { status: order.payment.status, method: order.payment.method } : null,
    refundPending: undefined,
  }
}

/** Vue client (suivi public) : jamais de données internes */
export function forCustomer(order) {
  const riderFirst = order.riderName ? order.riderName.split(/\s+/)[0] : null
  return {
    number: order.number,
    createdAt: order.createdAt,
    status: order.status,
    displayStatus: order.displayStatus,
    tab: order.tab,
    mode: order.mode,
    pickup: order.pickup,
    address: order.address ? { commune: order.address.commune, street: order.address.street } : null,
    parts: order.parts.map((p) => ({
      brand: p.brand,
      brandName: p.brandName,
      status: p.status,
      refusal: p.refusal,
      items: p.items.map(({ name, detail, price, qty, image, slug }) => ({ name, detail, price, qty, image, slug })),
      startedAt: p.startedAt,
      readyAt: p.readyAt,
      collectedAt: p.collectedAt,
    })),
    payment: order.payment ? { method: order.payment.method, provider: order.payment.provider, status: order.payment.status } : null,
    deliveryFee: order.deliveryFee,
    subtotal: order.subtotal,
    total: order.adjustedTotal,
    partial: order.partial,
    rider: riderFirst ? { firstName: riderFirst, eta: order.eta } : null,
    assignedAt: order.assignedAt,
    pickedUpAt: order.pickedUpAt,
    deliveredAt: order.deliveredAt,
    cancelled: order.cancelled,
    timeline: timeline(order),
  }
}

/** Étapes du suivi client (heures réelles) */
export function timeline(order) {
  const ready = order.parts.map((p) => p.readyAt).filter(Boolean).sort().at(-1) ?? null
  const started = order.parts.map((p) => p.startedAt).filter(Boolean).sort()[0] ?? null
  const steps = [
    { key: 'recue', label: 'Commande reçue', at: order.createdAt },
    { key: 'preparation', label: 'En préparation', at: started },
    { key: 'prete', label: 'Prête', at: ready },
  ]
  if (order.mode === 'livraison') steps.push({ key: 'route', label: 'En route', at: order.pickedUpAt }, { key: 'livree', label: 'Livrée', at: order.deliveredAt })
  else steps.push({ key: 'retiree', label: 'Retirée en boutique', at: order.deliveredAt })
  if (order.cancelled) steps.push({ key: 'annulee', label: 'Annulée', at: order.cancelled.at, reason: order.cancelled.reason })
  return steps
}
