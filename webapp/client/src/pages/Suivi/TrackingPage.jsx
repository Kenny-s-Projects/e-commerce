import { useCallback, useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'
import { whatsappFor } from '../../data/products.js'
import { formatPrice } from '../../data/houses.js'
import { PATCHI_PLACEHOLDER } from '../../data/live.js'
import { api } from '../../lib/api.js'
import { getAccessToken } from '../../lib/supabase.js'
import { phoneFor, rememberOrder } from '../../lib/orderMemory.js'
import { ease, fadeUp, underline } from '../Compte/accountUi.jsx'

const TRIP_SECONDS = 20 * 60 // durée de référence d'une course, pour la barre de progression
const REFRESH_MS = 30000

// Titre du bandeau selon l'état de la commande
const HEADLINE = {
  nouvelle: ['Votre commande est', 'reçue'],
  en_preparation: ['Votre commande est', 'en préparation'],
  prete: ['Votre commande est', 'prête'],
  assignee: ['Votre commande est', 'prête'],
  en_route: ['Votre commande est', 'en route'],
  livree: ['Votre commande est', 'livrée'],
  annulee: ['Votre commande est', 'annulée'],
}

const PAYMENT_LABEL = { mobile_money: 'mobile money', carte: 'carte bancaire' }

/**
 * Suivi d'une commande (#suivi/KC-0142) : données réelles de l'API (GET /orders/track/:number?phone=),
 * actualisées toutes les 30 s. Le téléphone de la commande sert de clé (mémorisé au checkout, sinon demandé).
 */
export default function TrackingPage({ number }) {
  const t = useT()
  const [phone, setPhone] = useState(() => phoneFor(number))
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)

  // Client connecté : son téléphone de profil, si la commande n'a pas été passée sur cet appareil
  useEffect(() => {
    if (phone) return
    let alive = true
    getAccessToken().then((token) => {
      if (!token) return
      api.get('/users/me').then((me) => alive && me?.phone && setPhone(me.phone)).catch(() => {})
    })
    return () => {
      alive = false
    }
  }, [phone])

  const load = useCallback(
    async (quiet = false) => {
      if (!phone) return
      try {
        const data = await api.get(`/orders/track/${encodeURIComponent(number)}`, { phone }, { auth: false })
        setOrder(data)
        setError(null)
        rememberOrder(number, phone)
      } catch (err) {
        if (!quiet) setOrder(null)
        setError(err)
      }
    },
    [number, phone],
  )

  useEffect(() => {
    const first = setTimeout(() => load(), 0)
    const id = setInterval(() => load(true), REFRESH_MS)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [load])

  if (!phone || (error && [400, 404].includes(error.status) && !order)) {
    return <PhoneForm number={number} initial={phone} notFound={Boolean(error)} onSubmit={(p) => { setError(null); setPhone(p) }} />
  }
  if (!order) {
    return (
      <section className="grid min-h-[60svh] place-items-center bg-white px-gutter text-center text-ink">
        {error ? (
          <div className="max-w-md">
            <p className="text-[18px]">{t('Le suivi est indisponible pour le moment.')}</p>
            <p className="mt-2 text-[14px] text-ink/60">{t(error.message)}</p>
            <button type="button" onClick={() => load()} className={`mt-6 text-[14px] ${underline}`}>{t('Réessayer')}</button>
          </div>
        ) : (
          <p className="text-[15px] text-ink/60">{t('Chargement du suivi…')}</p>
        )}
      </section>
    )
  }

  const status = order.displayStatus
  const enRoute = status === 'en_route'
  const [before, accent] = HEADLINE[status] ?? HEADLINE.nouvelle
  const concierge = whatsappFor(t('Bonjour, j’ai une question sur ma commande kclick {n}.', { n: order.number }))
  const steps = order.timeline ?? []
  const current = steps.findIndex((s) => !s.at)
  const items = order.parts.flatMap((p) => p.items.map((it) => ({ ...it, brandName: p.brandName, refused: p.status === 'refusee' || p.status === 'annulee' })))
  const paid = order.payment?.status === 'paye'

  return (
    <div className="bg-white text-ink">
      {/* Bandeau : statut et arrivée estimée */}
      <section className="bg-kyra text-kyra-ink">
        <div className="mx-auto grid max-w-[1100px] gap-6 px-gutter pb-7 pt-[clamp(28px,4vw,64px)] max-sm:px-[22px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-16 lg:pb-14">
          <m.div {...fadeUp()}>
            <p className="caps">{t('Commande {n}', { n: order.number })}</p>
            <h1 className="mt-4 text-[clamp(32px,4.2vw,56px)] font-light leading-[1.08] tracking-[-0.01em]">
              {t(before)} <span className="accent">{t(accent)}</span>.
            </h1>
            {!enRoute && status !== 'livree' && status !== 'annulee' && (
              <p className="mt-4 max-w-md text-[15px] leading-[1.6] text-kyra-ink/80">
                {order.mode === 'retrait' ? t('Nous vous prévenons dès qu’elle vous attend en boutique.') : t('Nous vous prévenons dès qu’elle part en livraison.')}
              </p>
            )}
            {order.cancelled && <p className="mt-4 max-w-md text-[15px] leading-[1.6] text-kyra-ink/80">{t(order.cancelled.reason)}</p>}
          </m.div>
          {enRoute && order.rider && <Countdown key={order.pickedUpAt} minutes={order.rider.eta ?? 15} since={order.pickedUpAt} rider={order.rider.firstName} />}
        </div>
      </section>

      <div className="mx-auto grid max-w-[1100px] gap-10 px-gutter py-[clamp(28px,4vw,64px)] max-sm:px-[22px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        {/* Étapes */}
        <m.ol aria-label={t('Étapes de la commande')} className="flex flex-col" {...fadeUp(0.1)}>
          {steps.map((s, i) => {
            const done = Boolean(s.at) && (current === -1 || i < current)
            const isCurrent = i === current
            const last = i === steps.length - 1
            return (
              <li key={s.key} className="relative flex items-start gap-4 pb-6 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
                {!last && <span aria-hidden className={`absolute left-[11px] top-6 h-[calc(100%-16px)] w-px ${done ? 'bg-ink' : 'bg-[#ddd7cb]'}`} />}
                <span aria-hidden className="relative grid size-6 shrink-0 place-items-center">
                  {isCurrent ? (
                    <span className="grid size-6 place-items-center rounded-full border-[3px] border-[#f4d2c0]">
                      <span className="size-3 rounded-full bg-kyra" />
                    </span>
                  ) : done ? (
                    <span className="size-3.5 rounded-full bg-ink" />
                  ) : (
                    <span className="size-5 rounded-full border-[3px] border-[#e3ddd2] bg-white" />
                  )}
                </span>
                <span className={`flex-1 pt-px text-[16px] ${done || isCurrent ? 'text-ink' : 'text-ink/45'}`}>{t(s.label)}</span>
                <span className="pt-0.5 font-mono text-[13px] text-ink/70">{s.at ? clock(s.at) : ''}</span>
              </li>
            )
          })}
        </m.ol>

        {/* Récapitulatif */}
        <m.div className="flex flex-col gap-4" {...fadeUp(0.18)}>
          <section aria-label={t('Récapitulatif')} className="bg-[#f6efe8] p-[18px] md:p-7">
            <ul className="flex flex-col gap-4 border-b border-ink/10 pb-4">
              {items.map((it, i) => (
                <li key={`${it.slug}-${i}`} className={`flex items-center gap-4 ${it.refused ? 'opacity-50' : ''}`}>
                  <span className="block size-[62px] shrink-0 overflow-hidden bg-white">
                    <img loading="lazy" decoding="async" src={it.image ?? PATCHI_PLACEHOLDER} alt="" className="block size-full object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="caps text-[9px] text-ink/60">{it.brandName}</p>
                    <p className={`mt-1 text-[15px] leading-snug ${it.refused ? 'line-through' : ''}`}>
                      {it.qty} × {t(it.name)}
                      {it.detail && <span className="text-ink/60"> · {it.detail}</span>}
                    </p>
                    {it.refused && <p className="mt-0.5 text-[12px] text-celio">{t('Indisponible')}</p>}
                  </div>
                  <span className="font-mono text-[14px]">{formatPrice(Math.round(it.price * it.qty * 100) / 100)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-ink/70">{order.mode === 'livraison' ? t('Livraison à Gombe') : t('Retrait en boutique')}</dt>
                <dd className="font-mono">{order.deliveryFee ? formatPrice(order.deliveryFee) : t('Gratuit')}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>
                  {paid
                    ? t('Payé en ligne ({p})', { p: t(PAYMENT_LABEL[order.payment.method] ?? '') })
                    : t('À payer ({p})', { p: t(PAYMENT_LABEL[order.payment?.method] ?? '') })}
                </dt>
                <dd className="font-mono">{formatPrice(order.total)}</dd>
              </div>
            </dl>
            {order.partial && <p className="mt-3 text-[12px] text-ink/70">{t('Commande partielle : un article n’était plus disponible, le total a été ajusté.')}</p>}
          </section>
          <a href={concierge} target="_blank" rel="noreferrer" className="caps grid h-14 place-items-center bg-ink text-[11px] text-white transition-colors hover:bg-black">
            {t('Une question ? Conciergerie')}
          </a>
          <p className="text-[12px] text-ink/55">{t('Mis à jour automatiquement toutes les 30 secondes.')}</p>
        </m.div>
      </div>
    </div>
  )
}

const clock = (iso) => {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Compte à rebours depuis le départ du livreur (temps annoncé par le livreur) */
function Countdown({ minutes, since, rider }) {
  const t = useT()
  const [now, setNow] = useState(() => Date.now())
  const [start] = useState(() => (since ? new Date(since).getTime() : Date.now()))
  const end = start + minutes * 60000
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const left = Math.max(0, Math.round((end - now) / 1000))
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const progress = Math.min(1, Math.max(0.05, 1 - left / TRIP_SECONDS))

  return (
    <m.div {...fadeUp(0.1)}>
      <p className="text-[14px]">{left > 0 ? t('Arrivée estimée dans') : t('Arrivée imminente')}</p>
      <p className="mt-1 font-mono text-[clamp(56px,7vw,88px)] font-normal leading-none tracking-[-0.04em] tabular-nums" aria-live="off">
        {mm}
        <span className="mx-0.5">:</span>
        {ss}
      </p>
      <div className="mt-5 h-1 overflow-hidden bg-kyra-ink/15" role="progressbar" aria-label={t('Progression de la livraison')} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <m.div className="h-full bg-kyra-ink" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.8, ease }} />
      </div>
      <p className="mt-4 flex items-center gap-3 text-[14px]">
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="5.5" cy="16.5" r="3" />
          <circle cx="18.5" cy="16.5" r="3" />
          <path d="M5.5 16.5 9 10h5l4.5 6.5M9 10 7.5 7H5.5M14 10l-1.5-3H15" />
        </svg>
        {t('{r} arrive à moto. Le temps est donné par le livreur.', { r: rider })}
      </p>
    </m.div>
  )
}

/** Téléphone de la commande, demandé quand il n'est pas connu sur cet appareil (ou ne correspond pas) */
function PhoneForm({ number, initial, notFound, onSubmit }) {
  const t = useT()
  const [value, setValue] = useState(initial ?? '')
  const [invalid, setInvalid] = useState(false)
  return (
    <section className="grid min-h-[calc(100svh-4rem)] place-items-center bg-white px-gutter py-20 text-ink">
      <m.form
        className="w-full max-w-[440px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        onSubmit={(e) => {
          e.preventDefault()
          const p = value.replace(/[^\d+ ]/g, '').trim()
          if (p.replace(/\D/g, '').length < 8) return setInvalid(true)
          onSubmit(p)
        }}
      >
        <p className="caps text-[#86671f]">{t('Suivi de commande')}</p>
        <h1 className="mt-4 text-[clamp(32px,4vw,46px)] font-light leading-tight">
          {t('Commande')} <span className="accent">{number}</span>
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-ink/70">
          {notFound
            ? t('Nous ne trouvons pas de commande avec ce numéro et ce téléphone. Vérifiez-les, ou écrivez à la conciergerie.')
            : t('Pour voir votre commande, saisissez le téléphone utilisé lors de la commande.')}
        </p>
        <label htmlFor="track-phone" className="mt-8 block text-[13px]">{t('Téléphone')}</label>
        <input
          id="track-phone"
          type="tel"
          autoComplete="tel"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setInvalid(false)
          }}
          placeholder="+243 …"
          className={`mt-2 h-12 w-full border bg-white px-4 text-[15px] outline-none focus:border-ink ${invalid ? 'border-celio' : 'border-ink/25'}`}
        />
        {invalid && <p className="mt-1 text-[12px] text-celio">{t('Numéro invalide')}</p>}
        <button type="submit" className="caps mt-5 h-14 w-full bg-ink text-[11px] text-white">{t('Voir ma commande')}</button>
        <a href={whatsappFor(t('Bonjour, je souhaite suivre ma commande kclick {n}.', { n: number }))} target="_blank" rel="noreferrer" className={`mt-6 inline-block text-[14px] ${underline}`}>
          {t('Écrire à la conciergerie')}
        </a>
      </m.form>
    </section>
  )
}
