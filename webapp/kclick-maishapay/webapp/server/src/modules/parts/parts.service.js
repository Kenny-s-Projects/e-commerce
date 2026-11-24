import { transaction } from '../../config/db.js'
import { events } from '../../shared/events.js'
import { badRequest, conflict, forbidden, notFound } from '../../shared/errors.js'
import * as orders from '../orders/orders.model.js'
import { recomputeOrder } from '../orders/orders.service.js'
import { forBrand, presentOrder } from '../orders/orders.present.js'
import { canMovePart } from '../orders/orders.status.js'
import * as payments from '../payments/payments.service.js'
import * as model from './parts.model.js'

// Le travail de chaque Maison : sa part dans chaque commande (Nouvelles → En préparation → Prêtes, ou rupture).

const ACTIVE_STATUSES = ['en_attente', 'en_cours', 'prete_retrait', 'en_livraison']

/** Maison visée : celle demandée (super-admin ou employé de cette Maison), sinon celle de l'employé */
async function resolveBrand(user, slug) {
  if (slug) {
    const brand = await model.findBrandBySlug(slug)
    if (!brand) throw notFound('Maison')
    if (!user.has('super_admin') && !user.brandIds.includes(brand.id)) throw forbidden('Cette Maison n’est pas la vôtre')
    return brand
  }
  if (!user.brandIds.length) throw badRequest('BRAND_REQUIRED', 'Préciser la Maison (?brand=patchi)')
  return { id: user.brandIds[0] }
}

/** File de la Maison : commandes PAYÉES qui contiennent sa part, avec seulement ses articles */
export async function listForBrand(user, { brand: slug, scope }) {
  const brand = await resolveBrand(user, slug)
  const since = scope === 'today' ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString() : null
  const rows = await orders.findOrderRows({
    brandId: brand.id,
    statuses: scope === 'active' ? ACTIVE_STATUSES : null,
    since,
    paidOnly: true, // une commande n'arrive chez la Maison qu'une fois le paiement confirmé
    limit: 200,
  })
  return rows.map(presentOrder).map((o) => forBrand(o, [brand.id]))
}

/**
 * Faire avancer une part : en_preparation, prete, ou refusee (rupture, motif obligatoire).
 * Refus : stock remis, paiement ajusté ou remboursement, la commande continue avec les autres Maisons.
 */
export async function setStatus(user, partId, { status, reason }) {
  const result = await transaction(async (db) => {
    const part = await orders.lockPart(db, partId)
    if (!part) throw notFound('Part')
    if (!user.has('super_admin') && !user.brandIds.includes(part.brand_id)) throw notFound('Part')
    if (!canMovePart(part.status, status)) throw conflict('INVALID_TRANSITION', `Changement impossible : ${part.status} → ${status}`)
    if (!(await payments.isPaid(db, part.order_id))) throw conflict('NOT_PAID', 'Cette commande n’est pas encore payée')

    await orders.setPartState(db, partId, { status, refusalReason: status === 'refusee' ? reason : null })
    await orders.insertHistory(db, { orderId: part.order_id, partId, from: part.status, to: status, by: user.id, reason: reason ?? null })

    let refund = null
    if (status === 'refusee') await orders.restorePartStock(db, partId)
    const { before, after } = await recomputeOrder(db, part.order_id, user.id)
    if (status === 'refusee') {
      refund = await payments.settlePartRefusal(db, {
        orderId: part.order_id,
        partId,
        method: before.payment_method,
        partAmount: Number(part.amount_due),
        newTotal: Number(after.adjusted_total),
      })
    }
    return { orderId: part.order_id, brand: part.brand, before, after, refund }
  })

  if (status === 'refusee')
    events.emit('part.refused', { orderId: result.orderId, partId, brand: result.brand, reason, newTotal: Number(result.after.adjusted_total), refund: result.refund ? Number(result.refund.amount) : 0 })
  else events.emit(status === 'prete' ? 'part.ready' : 'part.started', { orderId: result.orderId, partId, brand: result.brand })

  const row = await orders.findOrderRow(result.orderId)
  return forBrand(presentOrder(row), [row.parts.find((p) => p.id === partId).brand_id])
}
