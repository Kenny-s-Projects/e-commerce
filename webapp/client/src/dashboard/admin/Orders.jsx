/* eslint-disable react-refresh/only-export-components -- composants et petites fonctions liées, gardés ensemble */
import { LoadError, OrdersSkeleton } from '../ui/skeletons.jsx'
import { useMemo, useState } from 'react'
import { useStore } from '../store/store.jsx'
import { orderStatus } from '../lib/status.js'
import { ago, hour, money, orderTotal, partTotal } from '../lib/format.js'
import { Brand, Card, PageTitle, StatusPill } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { tr } from '../lib/i18n.js'

// Onglets de la liste des commandes (les 4 onglets des dashboards + Toutes)
export const TABS = [
  { id: 'toutes', label: 'Toutes', statuses: null },
  { id: 'attente', label: 'En attente', statuses: ['nouvelle'] },
  { id: 'cours', label: 'En cours', statuses: ['en_preparation', 'prete', 'assignee', 'en_route'] },
  { id: 'refusees', label: 'Refusées', statuses: ['annulee'] },
  { id: 'terminees', label: 'Terminées', statuses: ['livree'] },
]

/** Recherche par numéro de commande, téléphone ou nom du client */
export function matches(order, q) {
  const s = q.trim().toLowerCase()
  if (!s) return true
  const digits = s.replace(/\D/g, '')
  return (
    order.number.toLowerCase().includes(s) ||
    order.customer.name.toLowerCase().includes(s) ||
    (digits.length >= 3 && order.customer.phone.replace(/\D/g, '').includes(digits))
  )
}

/** Total affiché : pour une commande annulée, le montant qu'elle aurait eu */
export const displayTotal = (o) =>
  orderTotal(o) || o.parts.reduce((a, p) => a + partTotal(p), 0) + (o.mode === 'livraison' ? o.deliveryFee : 0)

export const detailHref = (o) => `#admin/commandes/${o.number}`

/** Colonne « Livreur » : nom + arrivée, à assigner, retrait en boutique, motif d'annulation */
function RiderCell({ order, status }) {
  const rider = order.riderName ? { name: order.riderName } : null
  if (status === 'annulee') return <span className="text-d-danger">{order.cancelled?.reason ?? tr('Annulée')}</span>
  if (order.mode === 'retrait') return <span className="text-d-muted">{tr('Retrait en boutique')}</span>
  if (rider) {
    return (
      <span>
        {rider.name}
        {status === 'en_route' && order.eta ? <span className="text-d-muted"> · {order.eta} min</span> : null}
      </span>
    )
  }
  return <span className="text-d-gold-ink">{tr('À assigner')}</span>
}

function Brands({ order, className = '' }) {
  return (
    <span className={`flex flex-col gap-1 ${className}`}>
      {order.parts.map((p) => (
        <Brand key={p.brand} id={p.brand} className="text-[13.5px]" />
      ))}
    </span>
  )
}

/**
 * Tableau des commandes (ordinateur et tablette) ; liste de cartes sur téléphone.
 * Chaque ligne ouvre le détail de la commande.
 */
export function OrdersTable({ orders, highlight }) {
  const { now } = useStore()
  if (!orders.length) return <p className="px-5 py-10 text-center text-sm text-d-muted">{tr('Aucune commande.')}</p>

  return (
    <>
      {/* Tablette et ordinateur */}
      <div className="overflow-x-auto max-sm:hidden">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-d-line text-[12.5px] text-d-muted">
              <th scope="col" className="py-3 pl-5 pr-3 font-normal">{tr('Commande')}</th>
              <th scope="col" className="px-3 py-3 font-normal">{tr('Client')}</th>
              <th scope="col" className="px-3 py-3 font-normal">{tr('Maisons')}</th>
              <th scope="col" className="px-3 py-3 font-normal">{tr('Mode')}</th>
              <th scope="col" className="px-3 py-3 text-right font-normal">{tr('Total')}</th>
              <th scope="col" className="px-3 py-3 font-normal">{tr('Statut')}</th>
              <th scope="col" className="py-3 pl-3 pr-5 font-normal">{tr('Livreur')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const status = orderStatus(o)
              return (
                <tr
                  key={o.number}
                  onClick={() => (window.location.hash = detailHref(o).slice(1))}
                  className={`cursor-pointer border-b border-d-line transition-colors last:border-0 hover:bg-[#faf9f6] ${
                    highlight === o.number ? 'animate-[slidein_0.6s_ease-out] bg-[#fbf6ea]' : ''
                  }`}
                >
                  <td className="py-3.5 pl-5 pr-3 align-middle">
                    <a href={detailHref(o)} onClick={(e) => e.stopPropagation()} className="font-mono text-[13.5px] underline decoration-d-border underline-offset-4 hover:decoration-d-ink">
                      {o.number}
                    </a>
                    <p className="mt-1 text-xs text-d-muted">
                      {hour(o.createdAt)}
                      {now - new Date(o.createdAt) < 3600000 ? ` · ${ago(o.createdAt, now)}` : ''}
                    </p>
                  </td>
                  <td className="max-w-[150px] px-3 py-3.5 align-middle">{o.customer.name}</td>
                  <td className="px-3 py-3.5 align-middle">
                    <Brands order={o} />
                  </td>
                  <td className="px-3 py-3.5 align-middle text-d-muted">{o.mode === 'livraison' ? tr('Livraison') : tr('Retrait')}</td>
                  <td className="px-3 py-3.5 text-right align-middle font-mono">{money(displayTotal(o))}</td>
                  <td className="px-3 py-3.5 align-middle">
                    <StatusPill status={status} />
                  </td>
                  <td className="max-w-[170px] py-3.5 pl-3 pr-5 align-middle">
                    <RiderCell order={o} status={status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Téléphone */}
      <ul className="divide-y divide-d-line sm:hidden">
        {orders.map((o) => {
          const status = orderStatus(o)
          return (
            <li key={o.number} className={highlight === o.number ? 'animate-[slidein_0.6s_ease-out] bg-[#fbf6ea]' : ''}>
              <a href={detailHref(o)} className="flex flex-col gap-2.5 px-4 py-4 active:bg-[#faf9f6]">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[14px]">{o.number}</span>
                  <StatusPill status={status} />
                </span>
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px]">{o.customer.name}</span>
                    <span className="mt-0.5 block text-xs text-d-muted">
                      {hour(o.createdAt)} · {o.mode === 'livraison' ? tr('Livraison') : tr('Retrait')}
                    </span>
                  </span>
                  <span className="font-mono text-[15px]">{money(displayTotal(o))}</span>
                </span>
                <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
                  <span className="flex gap-3">
                    {o.parts.map((p) => (
                      <Brand key={p.brand} id={p.brand} />
                    ))}
                  </span>
                  <RiderCell order={o} status={status} />
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** Champ de recherche (numéro, téléphone) */
export function SearchField({ value, onChange, onSubmit, className = '' }) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
      className={className}
    >
      <label className="flex h-11 items-center gap-3 rounded-[10px] border border-d-line bg-white px-4 focus-within:border-d-ink">
        <Icon name="search" className="size-4 shrink-0 text-d-muted" />
        <span className="sr-only">{tr('Rechercher une commande')}</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={tr('N° de commande, téléphone…')}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-d-muted"
        />
      </label>
    </form>
  )
}

/** Toutes les commandes, filtrables par onglet et par recherche */
export default function Orders() {
  const { orders, lastNewOrder, loading, loadError, retryLoad } = useStore()
  const [tab, setTab] = useState('toutes')
  const [q, setQ] = useState('')

  const sorted = useMemo(() => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [orders])
  const counts = Object.fromEntries(TABS.map((t) => [t.id, t.statuses ? sorted.filter((o) => t.statuses.includes(orderStatus(o))).length : sorted.length]))
  const current = TABS.find((t) => t.id === tab)
  const visible = sorted.filter((o) => (!current.statuses || current.statuses.includes(orderStatus(o))) && matches(o, q))

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={tr('Aujourd’hui')} live before={tr('Com')} accent={tr('mandes')} />
        <SearchField
          value={q}
          onChange={setQ}
          onSubmit={() => visible.length === 1 && (window.location.hash = detailHref(visible[0]).slice(1))}
          className="w-full sm:w-[320px]"
        />
      </header>

      <div role="tablist" aria-label={tr('Filtrer les commandes')} className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[13.5px] transition-colors ${
              tab === t.id ? 'border-d-ink bg-d-ink text-white' : 'border-d-line bg-white hover:border-d-border'
            }`}
          >
            {tr(t.label)}
            <span className={`font-mono text-xs ${tab === t.id ? 'text-white/70' : 'text-d-muted'}`}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <OrdersSkeleton />
      ) : loadError ? (
        <LoadError error={loadError} onRetry={retryLoad} />
      ) : (
        <Card className="overflow-hidden">
          <OrdersTable orders={visible} highlight={lastNewOrder} />
        </Card>
      )}
    </>
  )
}

