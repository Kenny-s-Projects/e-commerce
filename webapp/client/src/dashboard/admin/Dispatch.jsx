import { useState } from 'react'
import { BRANDS } from '../data/demo.js'
import { riderState, useStore } from '../store/store.jsx'
import { canDispatch, isActivePart, orderStatus } from '../lib/status.js'
import { hour, minutesSince, money, orderTotal } from '../lib/format.js'
import { Avatar, Brand, Button, Card, DemoNote, Mono, PageTitle, PartPill, RiderPill, StatusPill } from '../ui/ui.jsx'

/*
 * Dispatch : choisir une commande à livrer, puis le livreur qui la prend.
 * Une commande peut partir dès qu'une de ses parts est prête.
 */

function ColumnTitle({ id, children, count }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 text-[15px] font-medium">
      {children}
      {count != null && (
        <span className="rounded-full bg-[#fbefd5] px-2 py-0.5 font-mono text-xs text-[#7a5200]">{count}</span>
      )}
    </h2>
  )
}

const Empty = ({ children }) => (
  <p className="rounded-[14px] border border-dashed border-d-border px-5 py-8 text-center text-sm text-d-muted">{children}</p>
)

// Où en est le livreur : livre, récupère, ou libre
function riderJob(order) {
  if (!order) return 'Aucune course en cours.'
  if (order.pickedUpAt) {
    const left = order.eta != null ? Math.max(1, order.eta - minutesSince(order.pickedUpAt)) : null
    return `Livre ${order.number}${left ? `, arrivée prévue dans ${left} min` : ''}.`
  }
  const next = order.parts.find((p) => isActivePart(p) && p.status !== 'collectee')
  return next ? `Récupère ${order.number} chez ${BRANDS[next.brand].name}.` : `Récupère ${order.number}.`
}

function OrderCard({ order, selected, onSelect }) {
  const ready = canDispatch(order)
  const { street, landmark } = order.address ?? {}
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => ready && onSelect(order.number)}
      disabled={!ready}
      className={`flex animate-[slidein_0.4s_ease] flex-col gap-2.5 rounded-[14px] border-2 bg-white px-[18px] py-4 text-left transition-colors ${
        selected ? 'border-d-gold-ink' : 'border-d-line hover:border-d-border'
      } ${ready ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
    >
      <span className="flex items-baseline justify-between gap-2.5">
        <Mono className="text-sm">{order.number}</Mono>
        <Mono className="text-sm">{money(orderTotal(order))}</Mono>
      </span>
      <span className="text-[15px]">{order.customer.name}</span>
      <span className="text-[13px] text-d-muted">
        {order.address?.commune ?? 'Gombe'} · {[street, landmark].filter(Boolean).join(', ')}
      </span>
      <span className="flex flex-col gap-1.5 border-t border-d-soft pt-2">
        {order.parts.map((p) => (
          <span key={p.brand} className="flex items-center justify-between gap-2.5 text-[13px]">
            <Brand id={p.brand} />
            <PartPill status={p.status} className="h-[22px] px-[9px]" />
          </span>
        ))}
      </span>
      {!ready && <span className="text-xs text-d-muted">Aucune part prête : elle pourra partir dès qu’une Maison aura fini.</span>}
    </button>
  )
}

function RiderCard({ rider, state, target, onAssign }) {
  return (
    <Card className="flex flex-col gap-3.5 p-[18px]">
      <div className="flex items-start gap-3">
        <Avatar name={rider.name} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px]">{rider.name}</p>
          <p className="text-xs text-d-muted">
            {rider.vehicle} · zone {rider.zone}
          </p>
        </div>
        <RiderPill status={state.status} />
      </div>
      <p className="text-[13px] text-d-muted">{riderJob(state.order)}</p>
      <Button
        variant={state.status === 'disponible' ? 'solid' : 'outline'}
        disabled={!target || state.status === 'hors_ligne'}
        onClick={() => onAssign(rider.id)}
        className="w-full"
      >
        {target ? `Assigner ${target}` : 'Choisir une commande'}
      </Button>
    </Card>
  )
}

function RunCard({ order, rider }) {
  const status = orderStatus(order)
  const collected = order.parts.filter((p) => p.status === 'collectee')
  const pending = order.parts.find((p) => isActivePart(p) && p.status !== 'collectee')
  let detail
  if (order.pickedUpAt) {
    const where = collected.map((p) => BRANDS[p.brand].name).join(' et ')
    detail = `Récupérée chez ${where} à ${hour(order.pickedUpAt)}.`
  } else if (pending) {
    detail = `En chemin vers ${BRANDS[pending.brand].name} pour la récupérer.`
  } else detail = 'En préparation du départ.'
  const left = order.pickedUpAt && order.eta != null ? Math.max(1, order.eta - minutesSince(order.pickedUpAt)) : null

  return (
    <Card className="flex flex-col gap-2 p-[18px]">
      <div className="flex items-center justify-between gap-3">
        <Mono className="text-sm">{order.number}</Mono>
        <StatusPill status={status} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px]">
            {rider?.name} → {order.customer.name}
          </p>
          <p className="mt-1 text-[13px] text-d-muted">{detail}</p>
        </div>
        {left && <Mono className="shrink-0 text-[15px]">{left} min</Mono>}
      </div>
    </Card>
  )
}

export default function Dispatch() {
  const { orders, riders, dispatch } = useStore()
  const toAssign = orders
    .filter((o) => o.mode === 'livraison' && !o.riderId && !o.cancelled && !o.deliveredAt && o.parts.some(isActivePart))
    .sort((a, b) => Number(canDispatch(b)) - Number(canDispatch(a)) || new Date(a.createdAt) - new Date(b.createdAt))
  const runs = orders.filter((o) => o.riderId && !o.deliveredAt && !o.cancelled)

  const [picked, setPicked] = useState(null)
  const selectable = toAssign.filter(canDispatch)
  const selected = selectable.find((o) => o.number === picked) ?? selectable[0] ?? null

  const assign = (riderId) => {
    if (!selected) return
    dispatch({ type: 'order/assign', number: selected.number, riderId, eta: 25 })
    setPicked(null)
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow="Livraisons à Gombe · le jour même" before="Dis" accent="patch" />
        <p className="max-w-[420px] text-sm leading-[1.55] text-d-muted">
          Choisissez une commande à gauche, puis le livreur qui la prend. Une commande peut partir dès qu’une de ses parts est prête : le livreur
          passe d’abord chez cette Maison.
        </p>
      </header>

      <div className="grid items-start gap-[18px] lg:grid-cols-2 xl:grid-cols-3">
        <section aria-labelledby="h-todo" className="flex flex-col gap-3">
          <ColumnTitle id="h-todo" count={toAssign.length}>
            À assigner
          </ColumnTitle>
          {toAssign.length ? (
            toAssign.map((o) => <OrderCard key={o.number} order={o} selected={selected?.number === o.number} onSelect={setPicked} />)
          ) : (
            <Empty>Aucune commande à assigner.</Empty>
          )}
        </section>

        <section aria-labelledby="h-riders" className="flex flex-col gap-3">
          <ColumnTitle id="h-riders">Livreurs</ColumnTitle>
          {riders.map((r) => (
            <RiderCard key={r.id} rider={r} state={riderState(r, orders)} target={selected?.number} onAssign={assign} />
          ))}
        </section>

        <section aria-labelledby="h-runs" className="flex flex-col gap-3 lg:col-span-2 xl:col-span-1">
          <ColumnTitle id="h-runs">Courses en cours</ColumnTitle>
          {runs.length ? (
            runs.map((o) => <RunCard key={o.number} order={o} rider={riders.find((r) => r.id === o.riderId)} />)
          ) : (
            <Empty>Aucune course en cours.</Empty>
          )}
        </section>
      </div>

      <DemoNote className="mt-8" />
    </>
  )
}
