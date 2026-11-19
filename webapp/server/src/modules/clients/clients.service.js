import { notFound } from '../../shared/errors.js'
import { sum } from '../../shared/money.js'
import * as model from './clients.model.js'

// Clients : regroupés à partir des commandes (avec ou sans compte) et des comptes clients.
// Clé d'un client : l'id de son compte, ou « tel-<chiffres> » pour une commande sans compte.
// Une commande sans compte passée avec le téléphone d'un compte est rattachée à ce compte.

const digits = (phone) => (phone ?? '').replace(/\D/g, '')
const CLOSED = ['annulee', 'refusee']

async function buildClients() {
  const [orders, profiles] = await Promise.all([model.findOrderSummaries(), model.findClientProfiles()])
  const byPhone = new Map(profiles.filter((p) => digits(p.phone)).map((p) => [digits(p.phone), p.id]))
  const clients = new Map()

  for (const p of profiles)
    clients.set(p.id, { key: p.id, name: p.full_name, email: p.email, phone: p.phone, lang: p.lang, hasAccount: true, createdAt: p.created_at, orders: [] })

  for (const o of orders) {
    const key = o.customer_id ?? byPhone.get(digits(o.customer_phone)) ?? `tel-${digits(o.customer_phone)}`
    if (!clients.has(key))
      clients.set(key, { key, name: o.customer_name, email: o.customer_email, phone: o.customer_phone, lang: null, hasAccount: false, createdAt: o.created_at, orders: [] })
    const c = clients.get(key)
    c.orders.push(o)
    c.name ||= o.customer_name
    c.email ||= o.customer_email
    c.phone ||= o.customer_phone
    if (new Date(o.created_at) < new Date(c.createdAt)) c.createdAt = o.created_at
  }
  return [...clients.values()].map(withStats)
}

function withStats({ orders, ...c }) {
  const kept = orders.filter((o) => !CLOSED.includes(o.status))
  const brandCount = {}
  for (const o of kept) for (const b of o.brands) brandCount[b] = (brandCount[b] ?? 0) + 1
  const favoriteBrand = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  return {
    ...c,
    ordersCount: orders.length,
    totalSpent: sum(kept.map((o) => o.adjusted_total)),
    lastOrderAt: orders[0]?.created_at ?? null,
    favoriteBrand,
    _orders: orders,
  }
}

const strip = ({ _orders, ...c }) => c

export async function list({ search, filter = 'all' } = {}) {
  const q = search?.trim().toLowerCase()
  const qDigits = digits(search)
  return (await buildClients())
    .filter((c) => filter === 'all' || (filter === 'account' ? c.hasAccount : !c.hasAccount))
    .filter(
      (c) =>
        !q ||
        `${c.name ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && digits(c.phone).includes(qDigits)),
    )
    .sort((a, b) => new Date(b.lastOrderAt ?? b.createdAt) - new Date(a.lastOrderAt ?? a.createdAt))
    .map(strip)
}

export async function get(key) {
  const client = (await buildClients()).find((c) => c.key === key)
  if (!client) throw notFound('Client')
  return {
    ...strip(client),
    orders: client._orders.map((o) => ({
      id: o.id,
      number: o.number,
      createdAt: o.created_at,
      status: o.status,
      mode: o.mode,
      brands: o.brands,
      total: o.adjusted_total,
    })),
    addresses: client.hasAccount ? await model.findAddresses(client.key) : [],
  }
}
