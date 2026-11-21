import { useEffect, useSyncExternalStore } from 'react'
import { hasSession } from '../../lib/supabase.js'
import { api } from '../../lib/api.js'

/*
 * Destination de l'icône « Mon compte » du header :
 *  - pas de session → #compte (connexion)
 *  - client connecté → #compte/profil
 *  - équipe (admin, employé, livreur) → son espace (home renvoyé par GET /auth/me)
 * La session est détectée dans le stockage du navigateur, sans charger supabase-js.
 * GET /auth/me n'est appelé que si une session existe, une seule fois par session (résultat gardé en mémoire).
 */
const ANON = { connected: false, href: '#compte' }
let state = ANON
let checkedFor = null // 'anon' ou 'session' : état du stockage lors de la dernière vérification
const listeners = new Set()
const set = (next) => {
  state = next
  listeners.forEach((l) => l())
}
const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

function refresh() {
  const session = hasSession()
  const key = session ? 'session' : 'anon'
  if (key === checkedFor) return
  checkedFor = key
  if (!session) return set(ANON)
  // En attendant la réponse : un client (cas le plus courant)
  set({ connected: true, href: '#compte/profil' })
  api
    .get('/auth/me')
    .then((me) => checkedFor === 'session' && set({ connected: true, href: me?.home || '#compte/profil' }))
    .catch(() => {
      // Session expirée ou refusée : on renvoie vers la connexion
      if (checkedFor === 'session') set(ANON)
    })
}

/** { connected, href } — revérifié à chaque changement de page (connexion, déconnexion) */
export default function useAccount() {
  const snap = useSyncExternalStore(subscribe, () => state)
  useEffect(() => {
    refresh()
    window.addEventListener('hashchange', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('hashchange', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return snap
}
