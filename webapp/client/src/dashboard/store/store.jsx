/* eslint-disable react-refresh/only-export-components -- composants et petites fonctions liées, gardés ensemble */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/api.js'
import { getAccessToken, onSessionChange, signOut } from '../../lib/supabase.js'
import { tr } from '../lib/i18n.js'

/*
 * État partagé des dashboards, branché sur l'API Express.
 * Les écrans gardent la même interface qu'en démonstration :
 *   const { orders, riders, users, shopsOpen, now, dispatch } = useStore()
 * Les données utiles à l'espace ouvert (admin, employé, livreur) sont chargées, puis actualisées
 * toutes les 15 s tant que l'onglet est visible. Chaque action (dispatch) appelle l'API puis recharge.
 */

const POLL_MS = 15000

const EMPTY = {
  orders: [],
  riders: [],
  users: [],
  brands: [],
  shopsOpen: {},
  dashboard: null,
  riderSelf: null,
}

/** Rôle et Maison requis pour chaque espace */
export function canEnter(me, space, brand) {
  if (!me) return false
  const roles = me.roles ?? []
  const has = (r) => roles.some((x) => x.role === r)
  if (space === 'admin') return has('super_admin')
  if (space === 'employe') return has('super_admin') || roles.some((x) => x.role === 'employe' && x.brand === brand)
  if (space === 'livreur') return has('livreur')
  return true
}

/** Chargement des données d'un espace */
async function loadSpace(space, brand) {
  if (space === 'admin') {
    const [list, riders, brands, dashboard, users] = await Promise.all([
      api.get('/orders', { date: 'all', limit: 200 }),
      api.get('/deliveries/riders'),
      api.get('/brands'),
      api.get('/dashboards/admin'),
      api.get('/users'),
    ])
    return { orders: list.items, riders, brands, dashboard, users }
  }
  if (space === 'employe') {
    const [orders, brands, riders] = await Promise.all([
      api.get('/parts', { brand, scope: 'all' }),
      api.get('/brands'),
      api.get('/deliveries/riders').catch(() => []),
    ])
    return { orders, brands, riders }
  }
  if (space === 'livreur') {
    const mine = await api.get('/deliveries/mine')
    const self = { ...mine.rider }
    return { orders: [...mine.current, ...mine.deliveredToday], riderSelf: self, riders: [] }
  }
  return {}
}

const StoreContext = createContext(null)

export function DashboardStore({ space, brand, children }) {
  const [auth, setAuth] = useState({ status: 'loading', me: null })
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null) // échec du premier chargement (rien à afficher) → écran d'erreur + « Réessayer »
  const [toast, setToast] = useState(null) // { kind: 'error' | 'ok', text }
  const [lastNewOrder, setLastNewOrder] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const known = useRef(null) // numéros déjà vus (détection des nouvelles commandes)

  const notify = useCallback((text, kind = 'error') => {
    setToast({ text, kind, id: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(() => setToast(null), toast.kind === 'error' ? 7000 : 3500)
    return () => clearTimeout(id)
  }, [toast])

  /* ---------- Session ---------- */
  const refreshMe = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setAuth({ status: 'anon', me: null })
      return null
    }
    try {
      const me = await api.get('/auth/me')
      setAuth({ status: 'ok', me })
      return me
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        if (err.code === 'ACCOUNT_DISABLED') notify(tr(err.message))
        await signOut()
        setAuth({ status: 'anon', me: null })
      } else {
        setAuth({ status: 'error', me: null, error: err.message })
      }
      return null
    }
  }, [notify])

  useEffect(() => {
    // refreshMe est asynchrone : l'état change après la réponse du serveur, pas pendant l'effet
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshMe()
    return onSessionChange((session) => {
      if (!session) setAuth({ status: 'anon', me: null })
    })
  }, [refreshMe])

  const logout = useCallback(async () => {
    await signOut()
    setAuth({ status: 'anon', me: null })
    setData(EMPTY)
    window.location.hash = 'connexion'
  }, [])

  /* ---------- Données ---------- */
  const ready = auth.status === 'ok' && canEnter(auth.me, space, brand) && ['admin', 'employe', 'livreur'].includes(space)

  const reload = useCallback(async () => {
    if (!ready) return
    try {
      const next = await loadSpace(space, brand)
      const shopsOpen = next.brands ? Object.fromEntries(next.brands.map((b) => [b.slug, b.is_open])) : undefined
      setData((d) => ({ ...d, ...next, ...(shopsOpen ? { shopsOpen } : {}) }))
      // Nouvelle commande arrivée depuis le dernier chargement : surbrillance (et son côté employé)
      const numbers = (next.orders ?? []).map((o) => o.number)
      if (known.current) {
        const fresh = numbers.filter((n) => !known.current.has(n))
        if (fresh.length) setLastNewOrder(fresh[0])
      }
      known.current = new Set(numbers)
      setNow(Date.now())
      setLoadError(null)
    } catch (err) {
      notify(tr(err.message))
      // Premier chargement raté : pas de squelette sans fin, on affiche l'erreur (les actualisations suivantes gardent les données)
      if (!known.current) setLoadError(err)
    } finally {
      setLoading(false)
    }
  }, [ready, space, brand, notify])

  // « Réessayer » après un premier chargement raté : squelettes de nouveau, puis nouvel essai
  const retryLoad = useCallback(() => {
    setLoadError(null)
    setLoading(true)
    reload()
  }, [reload])

  // Le store est recréé à chaque changement d'espace (clé dans DashboardApp) : on charge simplement les données
  useEffect(() => {
    known.current = null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload est asynchrone (état modifié après la réponse)
    reload()
  }, [reload])

  // Actualisation régulière, seulement quand l'onglet est visible
  useEffect(() => {
    if (!ready) return undefined
    const tick = () => document.visibilityState === 'visible' && reload()
    const id = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [ready, reload])

  /* ---------- Actions ---------- */
  const byNumber = useCallback((number) => data.orders.find((o) => o.number === number), [data.orders])
  const partOf = (order, brandSlug) => order?.parts.find((p) => p.brand === brandSlug)

  // Mise à jour immédiate de l'écran avant la réponse du serveur (annulée par le rechargement en cas d'erreur)
  const patchOrder = (number, fn) => setData((d) => ({ ...d, orders: d.orders.map((o) => (o.number === number ? fn(o) : o)) }))
  const patchPart = (number, brandSlug, changes) =>
    patchOrder(number, (o) => ({ ...o, parts: o.parts.map((p) => (p.brand === brandSlug ? { ...p, ...changes } : p)) }))

  const dispatch = useCallback(
    async (action) => {
      const order = action.number ? byNumber(action.number) : null
      const stamp = new Date().toISOString()
      try {
        switch (action.type) {
          case 'part/start':
            patchPart(action.number, action.brand, { status: 'en_preparation', startedAt: stamp })
            await api.patch(`/parts/${partOf(order, action.brand).id}/status`, { status: 'en_preparation' })
            break
          case 'part/ready':
            patchPart(action.number, action.brand, { status: 'prete', readyAt: stamp })
            await api.patch(`/parts/${partOf(order, action.brand).id}/status`, { status: 'prete' })
            break
          case 'part/refuse':
            await api.patch(`/parts/${partOf(order, action.brand).id}/status`, { status: 'refusee', reason: action.reason })
            notify(tr('Rupture signalée.'), 'ok')
            break
          case 'order/assign':
            await api.post('/deliveries', { orderId: order.id, riderId: action.riderId, etaMinutes: action.eta ?? undefined })
            notify(tr('{n} assignée.', { n: action.number }), 'ok')
            break
          case 'rider/collect':
            await api.post(`/deliveries/${order.id}/collect`, { brand: action.brand })
            break
          case 'rider/deliver':
            await api.post(`/deliveries/${order.id}/delivered`)
            break
          case 'rider/availability':
            setData((d) => ({ ...d, riderSelf: d.riderSelf ? { ...d.riderSelf, available: action.available } : d.riderSelf }))
            await api.patch('/deliveries/me/availability', { available: action.available })
            break
          case 'order/cancel':
            await api.post(`/orders/${order.id}/cancel`, { reason: action.reason })
            notify(tr('{n} annulée.', { n: action.number }), 'ok')
            break
          case 'order/pickedByCustomer':
            await api.post(`/orders/${order.id}/handover`)
            notify(tr('{n} remise au client.', { n: action.number }), 'ok')
            break
          case 'shop/toggle': {
            const open = !data.shopsOpen[action.brand]
            setData((d) => ({ ...d, shopsOpen: { ...d.shopsOpen, [action.brand]: open } }))
            await api.patch(`/brands/${action.brand}`, { isOpen: open })
            notify(open ? tr('Maison ouverte à la vente.') : tr('Maison fermée : produits « bientôt disponibles ».'), 'ok')
            break
          }
          case 'user/invite': {
            const result = await api.post('/users/invitations', action.user)
            await reload()
            return { ok: true, result }
          }
          case 'user/update': {
            const { status, ...changes } = action.changes
            const fields = Object.fromEntries(
              Object.entries(changes).filter(([k]) => ['firstName', 'lastName', 'phone', 'role', 'brand', 'vehicle', 'zone'].includes(k)),
            )
            if (Object.keys(fields).length) await api.patch(`/users/${action.id}`, fields)
            if (status === 'desactive') await api.post(`/users/${action.id}/deactivate`)
            if (status === 'actif') await api.post(`/users/${action.id}/reactivate`)
            break
          }
          default:
            return { ok: false }
        }
      } catch (err) {
        // L'erreur est affichée dans le bandeau ; l'écran peut aussi la lire dans le résultat
        notify(tr(err.message))
        await reload()
        return { error: err }
      }
      await reload()
      return { ok: true }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- patchOrder/patchPart ne dépendent que de setData
    [byNumber, data.shopsOpen, notify, reload],
  )

  const value = useMemo(
    () => ({
      ...data,
      auth,
      me: auth.me,
      loading,
      loadError,
      retryLoad,
      now,
      lastNewOrder,
      toast,
      notify,
      dismissToast: () => setToast(null),
      dispatch,
      reload,
      refreshMe,
      logout,
    }),
    [data, auth, loading, loadError, retryLoad, now, lastNewOrder, toast, notify, dispatch, reload, refreshMe, logout],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

/** { orders, riders, users, brands, shopsOpen, dashboard, riderSelf, me, auth, loading, loadError, retryLoad, now, dispatch, notify, reload, logout } */
export const useStore = () => useContext(StoreContext)

export const useOrder = (number) => useStore().orders.find((o) => o.number === number) ?? null

/** Statut d'un livreur (calculé par l'API, ou d'après les commandes chargées) */
export function riderState(rider, orders) {
  const current = orders.find((o) => o.riderId === rider.id && !o.deliveredAt && !o.cancelled)
  if (current) return { status: 'en_course', order: current }
  if (rider.status) return { status: rider.status, order: null }
  return { status: rider.available ? 'disponible' : 'hors_ligne', order: null }
}
