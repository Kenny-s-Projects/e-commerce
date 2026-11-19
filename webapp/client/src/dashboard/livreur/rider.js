// Espace livreur : le livreur connecté (démonstration : Glody K.) et quelques aides partagées par ses écrans.
import { useStore } from '../store/store.jsx'
import { BRANDS } from '../data/demo.js'
import { isActivePart } from '../lib/status.js'

export const CURRENT_RIDER_ID = 'gk'

// Téléphone du livreur (démonstration)
export const RIDER_PHONE = '+243 81 640 22 18'

/** Livreur connecté et ses commandes : en cours (assignées, non livrées) et livrées */
export function useRider() {
  const { riders, orders, dispatch, now } = useStore()
  const rider = riders.find((r) => r.id === CURRENT_RIDER_ID)
  const mine = orders.filter((o) => o.riderId === CURRENT_RIDER_ID)
  const current = mine.filter((o) => !o.deliveredAt && !o.cancelled)
  const delivered = mine.filter((o) => o.deliveredAt).sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt))
  return { rider, current, delivered, dispatch, now }
}

/** Parts à récupérer, dans l'ordre : d'abord celles qui sont prêtes */
export const pickupParts = (order) => order.parts.filter(isActivePart)

/** « À récupérer chez Kyra et Patchi » */
export const brandList = (parts) => {
  const names = parts.map((p) => BRANDS[p.brand].name)
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : names[0] ?? ''
}

/** Statut affiché d'une course pour le livreur */
export function courseState(order) {
  if (order.deliveredAt) return { label: 'Livrée', tone: { bg: '#d7e9dc', fg: '#1f4a2c' } }
  if (order.pickedUpAt) return { label: 'En route', tone: { bg: '#fbe4d8', fg: '#9a3f1c' } }
  return { label: 'À récupérer', tone: { bg: '#ece5f5', fg: '#5a3f7a' } }
}

// Couleur du texte de l'état d'une part (la maquette affiche du texte coloré, sans pastille)
export const PART_TEXT = {
  nouvelle: { label: 'Nouvelle', color: '#1f4e8c' },
  en_preparation: { label: 'En préparation', color: '#7a5200' },
  prete: { label: 'Prête', color: '#2f5a37' },
  collectee: { label: 'Récupérée', color: '#1f4a2c' },
  refusee: { label: 'Rupture', color: '#8e2118' },
  annulee: { label: 'Annulée', color: '#8e2118' },
}

export const shortStreet = (street = '') => street.replace(/^avenue /i, 'av. ').replace(/^boulevard /i, 'bd ')

export const brandsOf = (order) => order.parts.map((p) => BRANDS[p.brand].name).join(', ')
