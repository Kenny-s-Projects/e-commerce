import { useEffect, useState } from 'react'
import { BRANDS } from '../data/demo.js'
import { api } from '../../lib/api.js'
import { useOrder, useStore } from '../store/store.jsx'
import { canDispatch, isOpen, orderStatus } from '../lib/status.js'
import { clock, dateLocale, hour, money, orderSubtotal, partTotal } from '../lib/format.js'
import { timeline } from '../lib/timeline.js'
import { Button, Card, PartPill, Pill, StatusPill, telHref, waHref } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { tr } from '../lib/i18n.js'


const PAYMENT_TONE = {
  paye: { get label() { return tr('Payée') }, bg: '#e1eee2', fg: '#2f5a37' },
  en_attente: { get label() { return tr('En attente') }, bg: '#fbefd5', fg: '#7a5200' },
  rembourse: { get label() { return tr('Remboursée') }, bg: '#ece5f5', fg: '#5a3f7a' },
  echoue: { get label() { return tr('Échouée') }, bg: '#f7deda', fg: '#8e2118' },
}
const METHOD = { mobile_money: 'Mobile money', carte: 'Carte bancaire' }

const isToday = (d) => new Date(d).toDateString() === new Date().toDateString()

/** Une part : les articles d'une Maison et ce qui lui revient */
function PartCard({ part }) {
  const b = BRANDS[part.brand]
  const off = part.status === 'refusee' || part.status === 'annulee'
  return (
    <Card className="overflow-hidden">
      <div className="h-[3px]" style={{ background: b.color }} aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-d-line px-5 py-4">
        <h2 className="text-[17px] font-medium">{tr('Part {brand}', { brand: b.name })}</h2>
        <span className="flex items-center gap-3 text-[13px] text-d-muted">
          {part.staff ? `${part.staff} · ${b.shop}` : b.shop}
          <PartPill status={part.status} />
        </span>
      </div>
      <ul className={`divide-y divide-d-line ${off ? 'opacity-55' : ''}`}>
        {part.items.map((i) => (
          <li key={i.id ?? `${i.name}-${i.detail}`} className="flex gap-4 px-5 py-4">
            {i.image ? (
              <img src={i.image} alt="" className="size-14 shrink-0 rounded-md bg-d-soft object-cover" />
            ) : (
              <span className="size-14 shrink-0 rounded-md" style={{ background: b.color, opacity: 0.85 }} aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className={`text-[15px] ${off ? 'line-through' : ''}`}>{i.name}</p>
                <p className="font-mono text-[15px]">{money(i.price * i.qty)}</p>
              </div>
              <p className="mt-1 text-[13px] text-d-muted">
                {[i.detail, i.ref && <>{tr('Réf.')} <span className="font-mono">{i.ref}</span></>, tr('quantité {n}', { n: i.qty })]
                  .filter(Boolean)
                  .map((x, k) => (
                    <span key={k}>
                      {k > 0 && ' · '}
                      {x}
                    </span>
                  ))}
              </p>
              {i.gift && (
                <p className="mt-3 rounded-lg bg-d-soft px-3 py-2 text-[13px]">
                  {tr('Mot cadeau :')} « {i.gift} »
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {part.status === 'refusee' && part.refusal && (
        <p className="border-t border-d-line bg-[#fbf3f1] px-5 py-3 text-[13px] text-d-danger">{tr('Rupture signalée :')} {part.refusal}</p>
      )}
      <div className="flex items-center justify-between border-t border-d-line px-5 py-3.5 text-sm">
        <span className="text-d-muted">{tr('Revient à {brand}', { brand: b.name })}</span>
        <span className="font-mono">{off ? money(0) : money(partTotal(part))}</span>
      </div>
    </Card>
  )
}

function Payment({ order }) {
  const sub = orderSubtotal(order)
  const fee = order.mode === 'livraison' && sub ? order.deliveryFee : 0
  const pay = order.payment
  return (
    <Card className="px-5 py-[18px]">
      <h2 className="mb-4 text-[17px] font-medium">{tr('Paiement')}</h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-d-muted">{tr('Sous-total')}</dt>
          <dd className="font-mono">{money(sub)}</dd>
        </div>
        <div className="flex justify-between border-b border-d-line pb-3">
          <dt className="text-d-muted">{order.mode === 'livraison' ? tr('Livraison à Gombe') : tr('Retrait en boutique')}</dt>
          <dd className="font-mono">{order.mode === 'livraison' ? money(fee) : tr('Gratuit')}</dd>
        </div>
        <div className="flex justify-between pt-1 text-[15px]">
          <dt>{tr('Total')}</dt>
          <dd className="font-mono">{money(sub + fee)}</dd>
        </div>
      </dl>
      {order.partial && !order.cancelled && <p className="mt-3 text-[13px] text-[#7a5200]">{tr('Commande partielle : le total tient compte de la part en rupture.')}</p>}
      {pay && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <Pill tone={PAYMENT_TONE[pay.status] ?? PAYMENT_TONE.en_attente} />
          <span>
            {tr(METHOD[pay.method] ?? pay.method)}
            {pay.provider ? ` (${pay.provider})` : ''} · {hour(pay.at)}
            {pay.ref && (
              <>
                {' · '}
                <span className="font-mono text-[13px] text-d-muted">{pay.ref}</span>
              </>
            )}
          </span>
        </p>
      )}
    </Card>
  )
}

function Customer({ order }) {
  const c = order.customer
  return (
    <Card className="px-5 py-[18px]">
      <h2 className="mb-3 text-[17px] font-medium">{tr('Client')}</h2>
      <p className="text-[15px]">{c.name}</p>
      <p className="mt-1 font-mono text-[13.5px] text-d-muted">{c.phone}</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <a href={telHref(c.phone)} className="inline-flex h-11 items-center gap-2 rounded-lg border border-d-ink px-4 text-sm hover:bg-d-soft">
          <Icon name="phone" className="size-4" />
          {tr('Appeler')}
        </a>
        <a href={waHref(c.phone, `Bonjour ${c.name.split(' ')[0]}, c’est kclick au sujet de votre commande ${order.number}.`)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border border-d-ink px-4 text-sm hover:bg-d-soft">
          <Icon name="whatsapp" className="size-4" />
          WhatsApp
        </a>
      </div>
      <h3 className="mb-2 mt-6 text-[13px] text-d-muted">{order.mode === 'livraison' ? tr('Adresse de livraison') : tr('Retrait en boutique')}</h3>
      {order.mode === 'livraison' && order.address ? (
        <p className="text-[14.5px] leading-relaxed">
          {order.address.commune}, {order.address.street}
          {order.address.landmark && (
            <>
              <br />
              {tr('Repère :')} {order.address.landmark}
            </>
          )}
        </p>
      ) : (
        <p className="text-[14.5px] leading-relaxed">{order.pickup ? `${order.pickup.name}, ${order.pickup.address ?? ''}` : tr('Point de retrait')}</p>
      )}
    </Card>
  )
}

function Timeline({ order }) {
  const events = timeline(order)
  return (
    <Card className="px-5 py-[18px]">
      <h2 className="mb-4 text-[17px] font-medium">{tr('Chronologie')}</h2>
      <ol>
        {events.map((e, i) => (
          <li key={`${e.label}-${i}`} className="grid grid-cols-[48px_20px_minmax(0,1fr)] gap-x-2">
            <span className="pt-px font-mono text-[12.5px] text-d-muted">{clock(e.at)}</span>
            <span className="relative flex justify-center" aria-hidden>
              <span className="relative z-10 mt-1 size-2.5 rounded-full" style={{ background: e.color }} />
              {i < events.length - 1 && <span className="absolute bottom-0 top-3 w-px bg-d-line" />}
            </span>
            <span className="pb-5">
              <span className="block text-[14.5px]">{e.label}</span>
              {e.who && <span className="mt-0.5 block text-xs text-d-muted">{e.who}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/** Confirmation d'annulation, avec motif obligatoire */
function CancelPanel({ order, onClose }) {
  const { dispatch } = useStore()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (reason.trim().length < 3) return setError(tr('Indiquez le motif de l’annulation.'))
    dispatch({ type: 'order/cancel', number: order.number, reason: reason.trim() })
    onClose()
  }
  return (
    <Card as="form" onSubmit={submit} className="mb-6 border-d-danger/40 bg-[#fdf8f7] px-5 py-[18px]">
      <h2 className="text-[16px] font-medium text-d-danger">{tr('Annuler la commande {n} ?', { n: order.number })}</h2>
      <p className="mt-1 text-[13.5px] text-d-muted">{tr('Les Maisons arrêtent la préparation ; si la commande est payée, un remboursement est créé.')}</p>
      <label className="mt-4 block text-[13px]" htmlFor="cancel-reason">
        {tr('Motif')}
      </label>
      <input
        id="cancel-reason"
        value={reason}
        onChange={(e) => {
          setReason(e.target.value)
          setError('')
        }}
        placeholder={tr('Client injoignable, rupture…')}
        className="mt-1.5 h-11 w-full rounded-lg border border-d-line bg-white px-3.5 text-sm outline-none focus:border-d-ink"
        aria-invalid={!!error}
        aria-describedby={error ? 'cancel-error' : undefined}
      />
      {error && (
        <p id="cancel-error" className="mt-1.5 text-[13px] text-d-danger">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button type="submit" variant="danger">
          {tr('Confirmer l’annulation')}
        </Button>
        <Button variant="soft" onClick={onClose}>
          {tr('Garder la commande')}
        </Button>
      </div>
    </Card>
  )
}

/** Super admin · Détail d'une commande */
export default function OrderDetail({ number }) {
  const listed = useOrder(number)
  const { loading, orders } = useStore()
  const [cancelling, setCancelling] = useState(false)
  // Commande plus ancienne que celles chargées : recherche par numéro
  const [found, setFound] = useState({ number: null, order: null, done: false })
  useEffect(() => {
    if (listed || loading) return
    let alive = true
    api
      .get('/orders', { search: number, limit: 5 })
      .then((r) => alive && setFound({ number, order: r.items.find((o) => o.number === number) ?? null, done: true }))
      .catch(() => alive && setFound({ number, order: null, done: true }))
    return () => {
      alive = false
    }
  }, [listed, loading, number, orders])
  const order = listed ?? (found.number === number ? found.order : null)

  if (!order && (loading || (found.number !== number && !listed))) {
    return <Card className="px-6 py-14 text-center text-sm text-d-muted">{tr('Chargement de la commande…')}</Card>
  }
  if (!order) {
    return (
      <Card className="px-6 py-14 text-center">
        <p className="text-[17px]">
          {tr('Commande')} <span className="font-mono">{number}</span> {tr('introuvable.')}
        </p>
        <a href="#admin/commandes" className="mt-4 inline-block text-[13px] underline decoration-d-border underline-offset-4">
          {tr('Retour aux commandes')}
        </a>
      </Card>
    )
  }

  const status = orderStatus(order)
  const open = isOpen(order)
  const dispatchable = canDispatch(order)

  return (
    <>
      <nav aria-label={tr('Fil d’Ariane')} className="mb-3 text-[13px] text-d-muted">
        <a href="#admin/commandes" className="underline decoration-d-border underline-offset-4 hover:text-d-ink">
          {tr('Commandes')}
        </a>{' '}
        / {order.number}
      </nav>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <h1 className="font-mono text-[clamp(28px,3vw,34px)] tracking-[-0.02em]">{order.number}</h1>
          <StatusPill status={status} className="h-7 px-3 text-[13px]" />
          <p className="w-full text-sm text-d-muted sm:w-auto">
            {isToday(order.createdAt)
              ? tr('Passée aujourd’hui à {time}', { time: hour(order.createdAt) })
              : tr('Passée le {date} à {time}', { date: new Date(order.createdAt).toLocaleDateString(dateLocale()), time: hour(order.createdAt) })}{' '}
            ·{' '}
            {order.source === 'simulation' ? tr('simulation') : tr('sur le site')}
          </p>
        </div>
        {open && (
          <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
            {order.mode === 'livraison' && !order.riderId && (
              <a
                href="#admin/dispatch"
                aria-disabled={!dispatchable}
                title={dispatchable ? undefined : tr('Disponible dès qu’une part est prête')}
                onClick={(e) => !dispatchable && e.preventDefault()}
                className={`inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-d-ink px-5 text-sm text-white hover:bg-black sm:flex-none ${dispatchable ? '' : 'pointer-events-none opacity-40'}`}
              >
                {tr('Assigner un livreur')}
              </a>
            )}
            {!cancelling && (
              <Button variant="danger" onClick={() => setCancelling(true)} className="flex-1 sm:flex-none">
                {tr('Annuler la commande')}
              </Button>
            )}
          </div>
        )}
      </header>

      {cancelling && open && <CancelPanel order={order} onClose={() => setCancelling(false)} />}

      {order.cancelled && (
        <p className="mb-6 rounded-[14px] border border-[#f0cfc8] bg-[#fbf3f1] px-5 py-3.5 text-sm text-d-danger">
          {tr('Commande annulée à {time}', { time: hour(order.cancelled.at) })} · {order.cancelled.reason}
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          {order.parts.map((p) => (
            <PartCard key={p.brand} part={p} />
          ))}
          <Payment order={order} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Customer order={order} />
          <Timeline order={order} />
        </div>
      </div>

    </>
  )
}
