import { BRANDS } from '../data/demo.js'
import { hour } from '../lib/format.js'
import { Button, Card, Mono, Pill, telHref, waHref } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { brandList, pickupParts, useRider } from './rider.js'
import { useStore } from '../store/store.jsx'
import { tr } from '../lib/i18n.js'

const lower = (s = '') => s.charAt(0).toLowerCase() + s.slice(1)

const partText = (p) => {
  const n = p.items.reduce((acc, i) => acc + i.qty, 0)
  const list = p.items.map((i) => `${i.qty > 1 ? `${i.qty} × ` : ''}${i.name}${i.detail ? `, ${lower(i.detail)}` : ''}`).join(' ; ')
  const state = tr(p.status === 'collectee' ? 'Récupérée.' : p.status === 'prete' ? 'Prête.' : 'En préparation.')
  const gift = p.items.some((i) => i.gift) ? ` ${tr('Mot cadeau joint.')}` : ''
  const count = tr(n > 1 ? '{n} articles' : '{n} article', { n })
  return `${tr('Boutique {brand}, Gombe.', { brand: BRANDS[p.brand].name })} ${count}${tr(' : ')}${list}. ${state}${gift}`
}

function Step({ index, title, text, color, state }) {
  const current = state === 'current'
  const done = state === 'done'
  return (
    <li
      className={`flex items-start gap-3.5 rounded-[14px] border-2 bg-white px-4 py-3.5 ${current ? 'border-d-gold-ink' : 'border-d-line'} ${done ? 'opacity-70' : ''}`}
      aria-current={current ? 'step' : undefined}
    >
      <span
        className={`grid size-[30px] shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
          current ? 'bg-d-ink text-white' : done ? 'bg-[#d7e9dc] text-[#1f4a2c]' : 'bg-d-soft text-d-muted'
        }`}
      >
        {done ? <Icon name="check" className="size-4" strokeWidth={2} /> : index}
        <span className="sr-only">{done ? ` (${tr('fait')})` : ''}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[15px] font-medium">
          {color && <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />}
          {title}
        </span>
        <span className="mt-1 block text-[13px] leading-[1.45] text-d-muted">{text}</span>
      </span>
    </li>
  )
}

function TopBar({ order, subtitle }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-d-ink px-4 pb-[18px] pt-[calc(18px+env(safe-area-inset-top))] text-[#f2efe8]">
      <a href="#livreur" aria-label={tr('Retour aux courses')} className="grid size-11 shrink-0 place-items-center rounded-[10px] border border-[#3a3631]">
        <Icon name="back" className="size-5" />
      </a>
      <span className="min-w-0 flex-1">
        <Mono className="text-[17px]">{order?.number ?? tr('Course')}</Mono>
        <span className="block truncate text-[13px] text-[#b9b3a7]">{subtitle}</span>
      </span>
      {order &&
        (order.payment?.status === 'paye' ? (
          <Pill tone={{ bg: '#d7e9dc', fg: '#1f4a2c' }}>{tr('Payée')}</Pill>
        ) : (
          // Paiement en ligne pas encore confirmé par l'équipe : le livreur n'encaisse jamais rien
          <Pill tone={{ bg: '#fbefd5', fg: '#7a5200' }}>{tr('Paiement en ligne')}</Pill>
        ))}
    </header>
  )
}

/** Livreur · Une course : récupérer chez chaque Maison, puis livrer au client */
export default function Course({ number }) {
  const { orders } = useStore()
  const { dispatch, loading } = useRider()
  // /deliveries/mine ne renvoie que les courses de ce livreur
  const order = orders.find((o) => o.number === number)

  if (!order && loading) return <TopBar order={null} subtitle={tr('Chargement…')} />
  if (!order) {
    return (
      <>
        <TopBar order={null} subtitle={tr('Course introuvable')} />
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="text-[15px]">{tr('Cette course ne vous est pas attribuée.')}</p>
          <p className="text-[13px] text-d-muted">{tr('Elle a peut-être été confiée à un autre livreur.')}</p>
          <a href="#livreur" className="mt-2 text-[13px] underline decoration-d-border underline-offset-4">{tr('Retour à mes courses')}</a>
        </div>
      </>
    )
  }

  // Parts récupérées d'abord, puis celles qui sont prêtes, puis celles en préparation
  const rank = { collectee: 0, prete: 1 }
  const parts = [...pickupParts(order)].sort((a, b) => (rank[a.status] ?? 2) - (rank[b.status] ?? 2))
  const toCollect = parts.filter((p) => p.status !== 'collectee')
  const next = toCollect[0] ?? null
  const delivered = Boolean(order.deliveredAt)
  const address = order.address ?? {}

  const subtitle = delivered
    ? tr('Livrée à {time}', { time: hour(order.deliveredAt) })
    : toCollect.length
      ? tr('À récupérer chez {brands}', { brands: brandList(toCollect) })
      : tr('En route vers {name}', { name: order.customer.name })

  if (delivered) {
    return (
      <>
        <TopBar order={order} subtitle={subtitle} />
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[#d7e9dc] text-[#1f4a2c]">
            <Icon name="check" className="size-7" strokeWidth={2} />
          </span>
          <p className="mt-2 text-[24px] font-light">
            {tr('Course')} <span className="font-serif italic">{tr('terminée')}</span>
          </p>
          <p className="text-sm text-d-muted">
            {tr('{name} a reçu sa commande à {time}. Rien à encaisser : le paiement se fait en ligne.', { name: order.customer.name, time: hour(order.deliveredAt) })}
          </p>
          <a href="#livreur" className="mt-4 inline-flex h-12 items-center rounded-xl bg-d-ink px-6 text-[15px] text-white">
            {tr('Retour à mes courses')}
          </a>
        </div>
      </>
    )
  }

  const stepState = (i) => {
    const doneCount = parts.length - toCollect.length
    if (i < doneCount) return 'done'
    if (i === doneCount) return 'current'
    return 'todo'
  }

  return (
    <div className="flex min-h-svh flex-col md:min-h-[calc(100svh-48px)]">
      <TopBar order={order} subtitle={subtitle} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <ol className="flex flex-col gap-2.5" aria-label={tr('Étapes de la course')}>
          {parts.map((p, i) => (
            <Step
              key={p.brand}
              index={i + 1}
              title={tr(p.status === 'collectee' ? 'Récupérée chez {brand}' : 'Récupérer chez {brand}', { brand: BRANDS[p.brand].name })}
              text={partText(p)}
              color={BRANDS[p.brand].color}
              state={stepState(i)}
            />
          ))}
          <Step
            index={parts.length + 1}
            title={tr('Livrer à {name}', { name: order.customer.name })}
            text={tr('Paiement en ligne : remise en main propre, rien à encaisser.')}
            state={toCollect.length ? 'todo' : 'current'}
          />
        </ol>

        <Card className="px-4 py-3.5">
          <p className="mb-0.5 text-[15px]">{order.customer.name}</p>
          <p className="mb-3 text-[13px] leading-normal text-d-muted">
            {address.commune}, {address.street}.
            {address.landmark && (
              <>
                <br />
                <b className="font-semibold">{tr('Référence')}</b>{tr(' : ')}{address.landmark}.
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <a href={telHref(order.customer.phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-d-ink text-[15px] hover:bg-d-soft">
              <Icon name="phone" className="size-[18px]" />
              {tr('Appeler')}
            </a>
            <a
              href={waHref(order.customer.phone, `Bonjour ${order.customer.name.split(' ')[0]}, je suis votre livreur kclick pour la commande ${order.number}.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-d-ink text-[15px] hover:bg-d-soft"
            >
              <Icon name="whatsapp" className="size-[18px]" />
              WhatsApp
            </a>
          </div>
        </Card>
      </div>

      <footer className="sticky bottom-0 z-20 flex flex-col gap-2 border-t border-d-line bg-d-bg px-4 pb-[calc(18px+env(safe-area-inset-bottom))] pt-3">
        {next ? (
          <Button
            size="lg"
            className="w-full rounded-[14px] font-medium"
            disabled={next.status !== 'prete'}
            onClick={() => dispatch({ type: 'rider/collect', number: order.number, brand: next.brand })}
          >
            {tr(next.status === 'prete' ? 'Récupérée chez {brand}' : '{brand} : pas encore prête', { brand: BRANDS[next.brand].name })}
          </Button>
        ) : (
          <Button size="lg" className="w-full rounded-[14px] font-medium" onClick={() => dispatch({ type: 'rider/deliver', number: order.number })}>
            {tr('Livrée au client')}
          </Button>
        )}
        {next && next.status !== 'prete' && (
          <p className="text-center text-xs text-d-muted">{tr('Le bouton s’active dès que la Maison marque la part prête.')}</p>
        )}
      </footer>
    </div>
  )
}
