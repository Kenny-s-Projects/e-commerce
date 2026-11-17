import { useEffect, useState } from 'react'

/**
 * Routeur minimal par ancre (pas de dépendance, compatible Netlify sans réglage) :
 *   ''  ou '#'           → { page: 'home' }
 *   '#maison/patchi'     → { page: 'house', id: 'patchi' }
 * Les autres ancres (#kyra, #produit/…) ne changent pas de page :
 * elles servent au défilement ou aux pages à venir.
 */
function parse(hash) {
  const h = hash.replace(/^#\/?/, '')
  if (h === '') return { page: 'home' }
  const house = h.match(/^maison\/([\w-]+)/)
  if (house) return { page: 'house', id: house[1] }
  return null
}

export default function useHashRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash) ?? { page: 'home' })

  useEffect(() => {
    const onChange = () => {
      const next = parse(window.location.hash)
      if (!next) return
      setRoute(next)
      window.scrollTo({ top: 0, behavior: 'instant' }) // nouvelle page : on repart du haut
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
