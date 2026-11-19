import { useMemo, useState } from 'react'
import { BRANDS } from '../data/demo.js'
import { riderState, useStore } from '../store/store.jsx'
import { ORDER_STATUS, ORDER_STATUS_KEYS, canDispatch, isActivePart, isOpen, orderStatus } from '../lib/status.js'
import { minutesSince, money, orderTotal, partTotal, today } from '../lib/format.js'
import { Avatar, Button, Card, CardTitle, PageTitle, RiderPill } from '../ui/ui.jsx'
import { OrdersTable, SearchField, detailHref, matches } from './Orders.jsx'

const LATE_AFTER = 20 // minutes avant qu'une commande pas encore prête devienne une alerte

/** Chiffre clé : libellé, grand nombre en mono, ligne d'explication */
function Kpi({ label, value, note, tone = 'text-d-muted' }) {
  return (
    <Card className="px-4 py-4 sm:px-5 sm:py-[18px]">
      <p className="mb-3 text-[13px] text-d-muted">{label}</p>
      <p className="font-mono text-[clamp(24px,7vw,32px)] leading-none tracking-[-0.02em]">{value}</p>
      <p className={`mt-3 text-xs ${tone}`}>{note}</p>
    </Card>
  )
}

/** Barre segmentée des commandes du jour par statut */
function StatusBreakdown({ orders }) {
  const counts = ORDER_STATUS_KEYS.map((k) => [k, orders.filter((o) => orderStatus(o) === k).length]).filter(([, n]) => n > 0)
  return (
    <Card className="px-5 py-[18px] lg:col-span-2">
      <h2 className="mb-4 text-base font-medium">Commandes du jour par statut</h2>
      <div className="flex h-3 gap-[3px] overflow-hidden rounded-full" role="img" aria-label={counts.map(([k, n]) => `${ORDER_STATUS[k].label} ${n}`).join(', ')}>
        {counts.map(([k, n]) => (
          <span key={k} className="block transition-[flex-grow] duration-500" style={{ flexGrow: n, background: ORDER_STATUS[k].bar }} />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
        {counts.map(([k, n]) => (
          <li key={k} className="inline-flex items-center gap-2 text-[13px]">
            <span className="size-2.5 rounded-[3px]" style={{ background: ORDER_STATUS[k].bar }} aria-hidden />
            {ORDER_STATUS[k].label}
            <span className="font-mono">{n}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Alerts({ orders, now, stock = [] }) {
  const alerts = []
  for (const o of orders) {
    if (!isOpen(o) || o.riderId || o.deliveredAt) continue
    const waiting = o.parts.filter((p) => p.status === 'nouvelle' || p.status === 'en_preparation')
    const m = minutesSince(o.createdAt, now)
    if (waiting.length && m >= LATE_AFTER) {
      alerts.push({
        key: `late-${o.number}`,
        href: detailHref(o),
        title: `${o.number} en préparation depuis ${m} min`,
        text:
          waiting.length > 1
            ? `Les parts ${waiting.map((p) => (BRANDS[p.brand]?.name ?? p.brandName)).join(' et ')} ne sont pas encore prêtes.`
            : `La part ${(BRANDS[waiting[0].brand]?.name ?? waiting[0].brandName)} n’est pas encore prête.`,
        level: 'warn',
      })
    }
  }
  for (const o of orders) {
    for (const p of o.parts.filter((x) => x.status === 'refusee')) {
      alerts.push({
        key: `refused-${o.number}-${p.brand}`,
        href: detailHref(o),
        title: `Rupture sur ${o.number}`,
        text: `${(BRANDS[p.brand]?.name ?? p.brandName)}${p.refusal ? ` : ${p.refusal}` : ''}. ${o.cancelled ? 'Commande annulée.' : 'La commande continue sans cette part.'}`,
        level: 'danger',
      })
    }
  }
  // Ruptures de stock calculées par l'API (pièces à 0, moins de 250 g pour les produits au poids)
  for (const a of stock) alerts.push({ key: `stock-${a.ref ?? a.title}`, title: a.title, text: a.text, level: 'danger' })

  return (
    <Card className="px-5 py-[18px]">
      <h2 className="mb-3 text-base font-medium">Alertes</h2>
      {alerts.length ? (
        <ul className="flex flex-col gap-3.5">
          {alerts.map((a) => {
            const body = (
              <>
                <span
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
                    a.level === 'warn' ? 'bg-[#fbefd5] text-[#7a5200]' : 'bg-[#f7deda] text-d-danger'
                  }`}
                  aria-hidden
                >
                  !
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-medium">{a.title}</span>
                  <span className="mt-0.5 block text-[13.5px] text-d-muted">{a.text}</span>
                </span>
              </>
            )
            return (
              <li key={a.key}>
                {a.href ? (
                  <a href={a.href} className="flex gap-3 rounded-lg hover:bg-[#faf9f6]">
                    {body}
                  </a>
                ) : (
                  <div className="flex gap-3">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-d-muted">Rien à signaler.</p>
      )}
    </Card>
  )
}

function SalesByBrand({ orders }) {
  const sales = Object.keys(BRANDS)
    .map((b) => [b, orders.filter((o) => !o.cancelled).reduce((acc, o) => acc + o.parts.filter((p) => p.brand === b && isActivePart(p)).reduce((s, p) => s + partTotal(p), 0), 0)])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...sales.map(([, v]) => v))
  return (
    <Card className="px-5 py-[18px]">
      <h2 className="mb-4 text-base font-medium">Ventes par Maison</h2>
      <ul className="flex flex-col gap-4">
        {sales.map(([b, v]) => (
          <li key={b}>
            <p className="mb-2 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: BRANDS[b].color }} aria-hidden />
                {BRANDS[b].name}
              </span>
              <span className="font-mono">{money(v)}</span>
            </p>
            <span className="block h-1.5 overflow-hidden rounded-full bg-d-soft">
              <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(v / max) * 100}%`, background: BRANDS[b].color }} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Riders({ riders, orders }) {
  return (
    <Card className="px-5 py-[18px]">
      <CardTitle
        className="mb-2"
        action={
          <a href="#admin/dispatch" className="text-[13px] underline decoration-d-border underline-offset-4 hover:decoration-d-ink">
            Dispatch
          </a>
        }
      >
        <span className="text-base">Livreurs</span>
      </CardTitle>
      {!riders.length && <p className="py-3 text-sm text-d-muted">Aucun livreur pour l’instant. Invitez-en un dans Utilisateurs et rôles.</p>}
      <ul className="divide-y divide-d-line">
        {riders.map((r) => {
          const { status, order } = riderState(r, orders)
          let line = `Zone ${r.zone}`
          if (order?.pickedUpAt) line = `${order.number} · arrivée dans ${order.eta ?? '…'} min`
          else if (order) {
            const next = order.parts.find((p) => p.status !== 'collectee' && isActivePart(p))
            line = next ? `${order.number} · récupère chez ${(BRANDS[next.brand]?.name ?? next.brandName)}` : `${order.number} · en route`
          }
          return (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <Avatar name={r.name || 'Livreur'} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px]">{r.name || 'Livreur'}</span>
                <span className="block truncate text-xs text-d-muted">{line}</span>
              </span>
              <RiderPill status={status} />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/** Super admin · Vue d'ensemble */
export default function Overview() {
  const { orders, riders, now, lastNewOrder, dispatch, dashboard, loading } = useStore()
  const [q, setQ] = useState('')

  // Commandes du jour (l'API renvoie aussi les plus anciennes, utiles à la recherche)
  const sorted = useMemo(() => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [orders])
  const midnight = new Date(now).setHours(0, 0, 0, 0)
  const todays = sorted.filter((o) => new Date(o.createdAt) >= midnight)
  const found = q.trim() ? sorted.filter((o) => matches(o, q)) : []
  const stockAlerts = (dashboard?.alerts ?? []).filter((a) => a.type === 'stock')

  const revenue = todays.filter((o) => !o.cancelled).reduce((acc, o) => acc + orderTotal(o), 0)
  const open = todays.filter(isOpen)
  const toAssign = todays.filter(canDispatch).length
  const delivered = todays.filter((o) => o.deliveredAt && o.mode === 'livraison')
  const avgDelay = delivered.length
    ? Math.round(delivered.reduce((acc, o) => acc + (new Date(o.deliveredAt) - new Date(o.createdAt)), 0) / delivered.length / 60000)
    : null

  return (
    <>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <PageTitle eyebrow={today()} live before="Vue d’" accent="ensemble" />
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-[310px] sm:flex-none">
            <SearchField
              value={q}
              onChange={setQ}
              onSubmit={() => found[0] && (window.location.hash = detailHref(found[0]).slice(1))}
            />
            {found.length > 0 && (
              <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-[10px] border border-d-line bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                {found.slice(0, 6).map((o) => (
                  <li key={o.number}>
                    <a href={detailHref(o)} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-d-bg">
                      <span className="font-mono">{o.number}</span>
                      <span className="truncate text-d-muted">{o.customer.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {import.meta.env.DEV && (
            <Button onClick={() => dispatch({ type: 'order/simulate' })} className="rounded-[10px] max-sm:w-full">
              Simuler une commande
            </Button>
          )}
        </div>
      </header>

      <section aria-label="Indicateurs du jour" className="mb-[18px] grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Commandes aujourd’hui" value={loading ? '…' : todays.length} note="Depuis minuit" />
        <Kpi label="Chiffre d’affaires" value={money(revenue)} note="Hors commandes annulées" />
        <Kpi
          label="En cours"
          value={open.length}
          note={toAssign ? `${toAssign} à assigner à un livreur` : 'Aucune commande à assigner'}
          tone={toAssign ? 'text-d-gold-ink' : 'text-d-muted'}
        />
        <Kpi label="Délai moyen de livraison" value={avgDelay == null ? '—' : `${avgDelay} min`} note="De la commande à la remise" />
      </section>

      <section className="mb-[18px] grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,0.95fr)]">
        <StatusBreakdown orders={todays} />
        <Alerts orders={todays} now={now} stock={stockAlerts} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.95fr)]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-[18px]">
            <h2 className="text-base font-medium">Commandes du jour</h2>
            <a href="#admin/commandes" className="text-[13px] underline decoration-d-border underline-offset-4 hover:decoration-d-ink">
              Tout voir
            </a>
          </div>
          {todays.length ? (
            <OrdersTable orders={todays.slice(0, 8)} highlight={lastNewOrder} />
          ) : (
            <p className="px-5 pb-6 text-sm text-d-muted">{loading ? 'Chargement des commandes…' : 'Aucune commande aujourd’hui pour l’instant.'}</p>
          )}
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:flex lg:flex-col">
          <SalesByBrand orders={todays} />
          <Riders riders={riders} orders={todays} />
        </div>
      </section>

    </>
  )
}
