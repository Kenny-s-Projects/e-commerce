// Espace livreur : le livreur connecté (GET /deliveries/mine) et quelques aides partagées par ses écrans.
import { useStore } from '../store/store.jsx'
import { BRANDS } from '../data/demo.js'
import { isActivePart } from '../lib/status.js'
import { tr } from '../lib/i18n.js'

/** Livreur connecté et ses commandes : en cours (assignées, non livrées) et livrées aujourd'hui */
export function useRider() {
  const { riderSelf, orders, dispatch, now, me, loading } = useStore()
  const rider = riderSelf
    ? { ...riderSelf, name: me?.fullName || me?.email || tr('Livreur'), firstName: (me?.fullName || '').split(/\s+/)[0] || tr('Livreur'), phone: me?.phone ?? null }
    : null
  const current = orders.filter((o) => !o.deliveredAt && !o.cancelled)
  const delivered = orders.filter((o) => o.deliveredAt).sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt))
  return { rider, current, delivered, dispatch, now, loading }
}

/** Parts à récupérer, dans l'ordre : d'abord celles qui sont prêtes */
export const pickupParts = (order) => order.parts.filter(isActivePart)

/** « À récupérer chez Kyra et Patchi » */
export const brandList = (parts) => {
  const names = parts.map((p) => BRANDS[p.brand]?.name ?? p.brandName)
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} ${tr('et')} ${names.at(-1)}` : names[0] ?? ''
}

/** Statut affiché d'une course pour le livreur */
export function courseState(order) {
  if (order.deliveredAt) return { label: tr('Livrée'), tone: { bg: '#d7e9dc', fg: '#1f4a2c' } }
  if (order.pickedUpAt) return { label: tr('En route'), tone: { bg: '#fbe4d8', fg: '#9a3f1c' } }
  return { label: tr('À récupérer'), tone: { bg: '#ece5f5', fg: '#5a3f7a' } }
}

// Couleur du texte de l'état d'une part (la maquette affiche du texte coloré, sans pastille)
export const PART_TEXT = {
  nouvelle: { get label() { return tr('Nouvelle') }, color: '#1f4e8c' },
  en_preparation: { get label() { return tr('En préparation') }, color: '#7a5200' },
  prete: { get label() { return tr('Prête') }, color: '#2f5a37' },
  collectee: { get label() { return tr('Récupérée') }, color: '#1f4a2c' },
  refusee: { get label() { return tr('Rupture') }, color: '#8e2118' },
  annulee: { get label() { return tr('Annulée') }, color: '#8e2118' },
}

export const shortStreet = (street = '') => street.replace(/^avenue /i, 'av. ').replace(/^boulevard /i, 'bd ')

export const brandsOf = (order) => order.parts.map((p) => BRANDS[p.brand]?.name ?? p.brandName).join(', ')
