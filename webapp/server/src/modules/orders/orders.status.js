// Machine à statuts : la seule source de vérité sur les changements autorisés.
// Les mêmes valeurs que les types order_status et part_status de la base.

/** Statut de la part d'une brand → statuts suivants possibles */
// Pas d'étape « acceptée » : l'employé passe directement de Nouvelle à En préparation (maquette).
// « acceptee » reste toléré pour d'anciennes données.
export const PART_TRANSITIONS = {
  en_attente: ['en_preparation', 'refusee'],
  acceptee: ['en_preparation', 'refusee'],
  en_preparation: ['prete', 'refusee'],
  prete: ['collectee'],
  collectee: [],
  refusee: [],
  annulee: [],
}

/** Statut global d'une commande → statuts suivants possibles (hors calcul automatique) */
export const ORDER_TRANSITIONS = {
  en_attente: ['en_cours', 'refusee', 'annulee'],
  en_cours: ['en_livraison', 'prete_retrait', 'refusee', 'annulee'],
  prete_retrait: ['retiree', 'annulee'],
  en_livraison: ['livree'],
  livree: [],
  retiree: [],
  refusee: [],
  annulee: [],
}

/** Les 4 onglets des dashboards */
export const TABS = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  prete_retrait: 'En cours',
  en_livraison: 'En cours',
  livree: 'Terminées',
  retiree: 'Terminées',
  refusee: 'Refusées',
  annulee: 'Refusées',
}

export const canMovePart = (from, to) => PART_TRANSITIONS[from]?.includes(to) ?? false
export const canMoveOrder = (from, to) => ORDER_TRANSITIONS[from]?.includes(to) ?? false
export const tabOf = (status) => TABS[status]

const ACTIVE = (p) => p.status !== 'refusee' && p.status !== 'annulee'

/**
 * Statut global calculé à partir des parts (même règle que refresh_order côté base).
 *  - aucune part active          → refusee (au moins un refus) ou annulee
 *  - toutes les parts en attente → en_attente
 *  - livraison, tout collecté    → en_livraison
 *  - sinon                       → en_cours
 * Les statuts posés à la main (prete_retrait, en_livraison, livree, retiree) ne sont pas recalculés.
 */
export function computeOrderState(order, parts) {
  const active = parts.filter(ACTIVE)
  const refused = parts.filter((p) => p.status === 'refusee')
  const amount = active.reduce((acc, p) => acc + Math.round(Number(p.amount_due) * 100), 0) / 100

  let status = order.status
  if (active.length === 0) status = refused.length ? 'refusee' : 'annulee'
  else if (order.status === 'en_attente' || order.status === 'en_cours') {
    if (active.every((p) => p.status === 'en_attente')) status = 'en_attente'
    else if (order.mode === 'livraison' && active.every((p) => p.status === 'collectee')) status = 'en_livraison'
    else status = 'en_cours'
  }

  return {
    status,
    isPartial: refused.length > 0 && active.length > 0,
    adjustedTotal: active.length ? amount + Number(order.delivery_fee) : 0,
  }
}

/** Le client peut-il encore annuler toute sa commande ? */
export const customerCanCancel = (order) =>
  order.status === 'en_attente' || (order.is_partial && ['en_cours', 'prete_retrait'].includes(order.status))

/* ---------- Statut affiché (même règle que le front : client/src/dashboard/lib/status.js) ---------- */

/** Statut d'une part pour l'affichage : « en_attente » et « acceptee » deviennent « nouvelle » */
export const partDisplayStatus = (status) => (status === 'en_attente' || status === 'acceptee' ? 'nouvelle' : status)

/**
 * Statut affiché d'une commande (7 valeurs : nouvelle, en_preparation, prete, assignee, en_route, livree, annulee).
 * Reçoit la forme « dashboard » (voir orders.present.js).
 */
export function displayStatus(order) {
  if (order.cancelled) return 'annulee'
  if (order.deliveredAt) return 'livree'
  if (order.pickedUpAt) return 'en_route'
  if (order.riderId) return 'assignee'
  const parts = order.parts.filter((p) => p.status !== 'refusee' && p.status !== 'annulee')
  if (!parts.length) return 'annulee'
  if (parts.every((p) => p.status === 'prete' || p.status === 'collectee')) return 'prete'
  if (parts.some((p) => p.status !== 'nouvelle')) return 'en_preparation'
  return 'nouvelle'
}

export const DISPLAY_STATUSES = ['nouvelle', 'en_preparation', 'prete', 'assignee', 'en_route', 'livree', 'annulee']

/** Livraison : peut partir dès qu'une part active est prête (le livreur passe d'abord chez cette Maison) */
export const canDispatch = (order) =>
  order.mode === 'livraison' && !order.riderId && !order.cancelled && !order.deliveredAt &&
  order.parts.some((p) => p.status === 'prete')
