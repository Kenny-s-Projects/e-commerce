/* eslint-disable react-refresh/only-export-components -- composants et petites fonctions liées, gardés ensemble */
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { BRANDS, ORDERS, RIDERS, SIMULATION_CUSTOMERS, SIMULATION_ITEMS, USERS } from '../data/demo.js'
import { isActivePart } from '../lib/status.js'

/*
 * État partagé des dashboards (démonstration) : une action faite sur un écran
 * (préparer une part, assigner un livreur…) se voit sur tous les autres.
 * Chaque action correspond à une route de l'API ; elles seront branchées à l'étape suivante.
 */

const now = () => new Date().toISOString()

const initial = {
  orders: ORDERS,
  riders: RIDERS,
  users: USERS,
  shopsOpen: Object.fromEntries(Object.keys(BRANDS).map((b) => [b, true])),
  lastNewOrder: null, // numéro de la dernière commande arrivée (son + surbrillance)
}

const updateOrder = (state, number, fn) => ({
  ...state,
  orders: state.orders.map((o) => (o.number === number ? fn(o) : o)),
})

const updatePart = (order, brand, fn) => ({ ...order, parts: order.parts.map((p) => (p.brand === brand ? fn(p) : p)) })

function reducer(state, action) {
  switch (action.type) {
    // Employé : Nouvelle → En préparation → Prête, ou rupture
    case 'part/start':
      return updateOrder(state, action.number, (o) => updatePart(o, action.brand, (p) => ({ ...p, status: 'en_preparation', startedAt: now() })))
    case 'part/ready':
      return updateOrder(state, action.number, (o) => updatePart(o, action.brand, (p) => ({ ...p, status: 'prete', readyAt: now() })))
    case 'part/refuse':
      return updateOrder(state, action.number, (o) => {
        const next = updatePart(o, action.brand, (p) => ({ ...p, status: 'refusee', refusedAt: now(), refusal: action.reason }))
        return next.parts.some(isActivePart) ? { ...next, partial: true } : { ...next, cancelled: { reason: `Rupture : ${action.reason}`, at: now() } }
      })

    // Retrait en boutique : le client est venu chercher sa commande
    case 'order/pickedByCustomer':
      return updateOrder(state, action.number, (o) => ({
        ...o,
        deliveredAt: now(),
        parts: o.parts.map((p) => (isActivePart(p) ? { ...p, status: 'collectee' } : p)),
      }))

    // Dispatch
    case 'order/assign':
      return updateOrder(state, action.number, (o) => ({ ...o, riderId: action.riderId, assignedAt: now(), eta: action.eta ?? null }))

    // Livreur : récupère chaque part, puis livre
    case 'rider/collect':
      return updateOrder(state, action.number, (o) => {
        const next = updatePart(o, action.brand, (p) => ({ ...p, status: 'collectee', collectedAt: now() }))
        const allCollected = next.parts.filter(isActivePart).every((p) => p.status === 'collectee')
        return allCollected ? { ...next, pickedUpAt: now(), eta: next.eta ?? 15 } : next
      })
    case 'rider/deliver':
      return updateOrder(state, action.number, (o) => ({ ...o, deliveredAt: now() }))
    case 'rider/availability':
      return { ...state, riders: state.riders.map((r) => (r.id === action.riderId ? { ...r, available: action.available } : r)) }

    case 'order/cancel':
      return updateOrder(state, action.number, (o) => ({
        ...o,
        cancelled: { reason: action.reason, at: now() },
        parts: o.parts.map((p) => (isActivePart(p) ? { ...p, status: 'annulee' } : p)),
      }))

    // Utilisateurs de l'équipe (super-admin)
    case 'user/invite': {
      const id = `u${Date.now()}`
      const user = { ...action.user, id, status: 'invite', lastSeenAt: null, createdAt: now() }
      // Un nouveau livreur apparaît aussi dans le dispatch
      const riders =
        user.role === 'livreur'
          ? [...state.riders, { id: `r${id}`, name: `${user.firstName} ${user.lastName[0]}.`, firstName: user.firstName, vehicle: user.vehicle || 'Moto', zone: user.zone || 'Gombe', available: false }]
          : state.riders
      return { ...state, users: [...state.users, { ...user, riderId: user.role === 'livreur' ? `r${id}` : undefined }], riders }
    }
    case 'user/update':
      return { ...state, users: state.users.map((u) => (u.id === action.id ? { ...u, ...action.changes } : u)) }

    case 'shop/toggle':
      return { ...state, shopsOpen: { ...state.shopsOpen, [action.brand]: !state.shopsOpen[action.brand] } }

    case 'order/simulate': {
      const max = Math.max(...state.orders.map((o) => Number(o.number.slice(3))))
      const number = `KC-${String(max + 1).padStart(4, '0')}`
      const c = SIMULATION_CUSTOMERS[max % SIMULATION_CUSTOMERS.length]
      const picks = [SIMULATION_ITEMS[max % 2], SIMULATION_ITEMS[2 + (max % 2)]]
      const brands = [...new Set(picks.map((i) => i.brand))]
      const order = {
        number,
        createdAt: now(),
        source: 'simulation',
        customer: { name: c.name, phone: c.phone },
        mode: 'livraison',
        deliveryFee: 4,
        address: { commune: 'Gombe', street: c.street, landmark: c.landmark },
        parts: brands.map((b) => ({
          brand: b,
          status: 'nouvelle',
          staff: undefined,
          items: picks.filter((i) => i.brand === b).map(({ name, detail, price, qty, house, ref }) => ({ name, detail, price, qty, house, ref })),
        })),
        payment: { method: 'mobile_money', provider: 'M-Pesa', status: 'paye', at: now(), ref: `MP-${50000 + max}` },
      }
      return { ...state, orders: [order, ...state.orders], lastNewOrder: number }
    }
    default:
      return state
  }
}

const StoreContext = createContext(null)

export function DashboardStore({ children }) {
  const [state, dispatch] = useReducer(reducer, initial)

  // Horloge : rafraîchit « il y a 3 min », « depuis 9 min »… toutes les 30 s
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  const value = useMemo(() => ({ ...state, now: tick, dispatch }), [state, tick])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

/** { orders, riders, shopsOpen, lastNewOrder, now, dispatch } */
export const useStore = () => useContext(StoreContext)

export const useOrder = (number) => useStore().orders.find((o) => o.number === number) ?? null

/** Statut d'un livreur : en course s'il a une commande assignée et non livrée */
export function riderState(rider, orders) {
  const current = orders.find((o) => o.riderId === rider.id && !o.deliveredAt && !o.cancelled)
  if (current) return { status: 'en_course', order: current }
  return { status: rider.available ? 'disponible' : 'hors_ligne', order: null }
}
