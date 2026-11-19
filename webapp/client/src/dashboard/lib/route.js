import { useEffect, useState } from 'react'
import { BRANDS } from '../data/demo.js'

/*
 * Adresses du dashboard (après le #) :
 *   dashboard                     → choix de l'espace (démonstration)
 *   admin                         → super-admin, vue d'ensemble
 *   admin/commandes               → toutes les commandes
 *   admin/commandes/KC-0142       → détail d'une commande
 *   admin/dispatch                → dispatch (et toute autre rubrique du menu : admin/livreurs…)
 *   employe/kyra                  → file des commandes de la Maison (employe seul → kyra)
 *   employe/kyra/retraits | disponibilites
 *   livreur                       → mes courses
 *   livreur/course/KC-0142        → une course
 *   livreur/historique | profil
 */
function parse() {
  const [space, a, b] = decodeURIComponent(window.location.hash.slice(1)).split('/')
  if (space === 'admin') return { space, section: a || 'vue', id: b ?? null }
  if (space === 'employe') {
    const brand = BRANDS[a] ? a : 'kyra'
    return { space, brand, section: (BRANDS[a] ? b : a) || 'file' }
  }
  if (space === 'livreur') return { space, section: a || 'courses', id: b ?? null }
  return { space: 'dashboard' }
}

export function useDashRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const go = (hash) => {
  window.location.hash = hash
}
