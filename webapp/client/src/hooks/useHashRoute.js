import { useEffect, useState } from 'react'
import { MAISON_PAGES } from '../data/houses.js'
import { offrir, aide } from '../data/pages.js'

const PROFILE_TABS = ['commandes', 'adresses', 'favoris', 'infos']

/*
 * Lit l'adresse après le # :
 *   maison/kyra        → page Maison
 *   produit/ccd01      → fiche produit
 *   offrir/pour-elle   → page Offrir, onglet choisi (offrir seul → 1er onglet)
 *   notre-histoire     → page Notre histoire
 *   aide/paiement      → page Aide, rubrique choisie (aide seul → Livraison ; contact → rubrique Contact)
 *   checkout           → page de commande
 *   compte             → connexion ; compte/inscription · compte/code · compte/profil/<onglet>
 *   suivi              → « Suivre ma commande » (numéro + téléphone, sans compte)
 *   suivi/KC-0140      → suivi d'une commande
 *   sinon              → accueil, avec une ancre éventuelle (#patchi…)
 */
const parse = () => {
  const hash = decodeURIComponent(window.location.hash.slice(1))
  const [head, sub] = hash.split('/')

  if (head === 'maison' && MAISON_PAGES.includes(sub)) return { page: 'maison', id: sub, anchor: '' }
  // Fiche produit : le catalogue réel arrive après le chargement, la page gère « introuvable »
  if (head === 'produit' && sub) return { page: 'produit', id: sub, anchor: '' }
  if (head === 'offrir') {
    const tab = offrir.tabs.find((t) => t.id === sub) ?? offrir.tabs[0]
    return { page: 'offrir', id: tab.id, anchor: '' }
  }
  if (head === 'notre-histoire') return { page: 'histoire', id: '', anchor: '' }
  if (head === 'checkout') return { page: 'checkout', id: '', anchor: '' }
  if (head === 'compte') {
    const [, , tab] = hash.split('/')
    if (sub === 'inscription') return { page: 'inscription', id: '', anchor: '' }
    if (sub === 'code') return { page: 'code', id: '', anchor: '' }
    if (sub === 'profil') return { page: 'profil', id: PROFILE_TABS.includes(tab) ? tab : 'commandes', anchor: '' }
    return { page: 'compte', id: '', anchor: '' }
  }
  if (head === 'suivi') return { page: 'suivi', id: (sub ?? '').toUpperCase(), anchor: '' }
  if (head === 'aide' || head === 'contact') {
    const id = head === 'contact' ? 'contact' : sub
    const section = aide.sections.find((s) => s.id === id) ?? aide.sections[0]
    return { page: 'aide', id: section.id, anchor: '' }
  }
  return { page: 'home', id: '', anchor: hash }
}

/** Route courante, mise à jour à chaque changement d'adresse (#…). */
export default function useHashRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

/*
 * Clé de page : une nouvelle clé = nouvelle page (fondu + retour en haut).
 * Changer d'onglet (Offrir) ou de rubrique (Aide) garde la même page.
 */
export const pageKeyOf = (route) => {
  if (route.page === 'maison' || route.page === 'produit' || route.page === 'suivi') return `${route.page}-${route.id}`
  return route.page
}
