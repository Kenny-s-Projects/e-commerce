// Machine à statuts : la seule source de vérité sur les changements autorisés.
// Les mêmes valeurs que les types order_status et part_status de la base.

/** Statut de la part d'une brand → statuts suivants possibles */
export const PART_TRANSITIONS = {
  en_attente: ['acceptee', 'refusee'],
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
