// Statuts affichés dans les dashboards (couleurs reprises de la maquette).
// Une commande a un statut d'affichage calculé à partir de ses parts et de sa livraison.
// Le libellé (label) suit la langue du dashboard : écrit en français, traduit à la lecture.
import { tr } from './i18n.js'

const st = (fr, colors) => ({ get label() { return tr(fr) }, ...colors })

export const ORDER_STATUS = {
  nouvelle: st('Nouvelle', { bar: '#3b6fb6', bg: '#e3ecf8', fg: '#1f4e8c' }),
  en_preparation: st('En préparation', { bar: '#d9a23b', bg: '#fbefd5', fg: '#7a5200' }),
  prete: st('Prête', { bar: '#5e9468', bg: '#e1eee2', fg: '#2f5a37' }),
  assignee: st('Assignée', { bar: '#8a6bb3', bg: '#ece5f5', fg: '#5a3f7a' }),
  en_route: st('En route', { bar: '#cf6333', bg: '#fbe4d8', fg: '#9a3f1c' }),
  livree: st('Livrée', { bar: '#2f6b40', bg: '#d7e9dc', fg: '#1f4a2c' }),
  annulee: st('Annulée', { bar: '#b8382c', bg: '#f7deda', fg: '#8e2118' }),
}
export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUS)

// Statut d'une part (le travail d'une Maison)
export const PART_STATUS = {
  nouvelle: ORDER_STATUS.nouvelle,
  en_preparation: ORDER_STATUS.en_preparation,
  prete: ORDER_STATUS.prete,
  collectee: st('Récupérée', { bar: '#2f6b40', bg: '#d7e9dc', fg: '#1f4a2c' }),
  refusee: st('Rupture', { bar: '#b8382c', bg: '#f7deda', fg: '#8e2118' }),
  annulee: ORDER_STATUS.annulee,
}

export const RIDER_STATUS = {
  disponible: st('Disponible', { bg: '#e1eee2', fg: '#2f5a37' }),
  en_course: st('En course', { bg: '#fbe4d8', fg: '#9a3f1c' }),
  hors_ligne: st('Hors ligne', { bg: '#efebe3', fg: '#5e5b55' }),
}

export const isActivePart = (p) => p.status !== 'refusee' && p.status !== 'annulee'

/** Statut affiché d'une commande */
export function orderStatus(order) {
  if (order.cancelled) return 'annulee'
  if (order.deliveredAt) return 'livree'
  if (order.pickedUpAt) return 'en_route'
  if (order.riderId) return 'assignee'
  const parts = order.parts.filter(isActivePart)
  if (!parts.length) return 'annulee'
  if (parts.every((p) => p.status === 'prete' || p.status === 'collectee')) return 'prete'
  if (parts.some((p) => p.status !== 'nouvelle')) return 'en_preparation'
  return 'nouvelle'
}

/** Une commande en livraison peut partir dès qu'une de ses parts est prête (le livreur passe d'abord chez cette Maison) */
export const canDispatch = (order) =>
  order.mode === 'livraison' && !order.riderId && !order.cancelled && order.parts.some((p) => p.status === 'prete')

export const isOpen = (order) => !['livree', 'annulee'].includes(orderStatus(order))
