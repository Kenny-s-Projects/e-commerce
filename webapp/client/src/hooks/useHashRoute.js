import { useEffect, useState } from 'react'
import { MAISON_PAGES } from '../data/houses.js'

// Lit l'adresse après le # : « maison/kyra » → page Maison, sinon accueil (avec une ancre éventuelle)
const parse = () => {
  const hash = decodeURIComponent(window.location.hash.slice(1))
  const m = hash.match(/^maison\/([a-z]+)$/)
  if (m && MAISON_PAGES.includes(m[1])) return { page: 'maison', id: m[1], anchor: '' }
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
