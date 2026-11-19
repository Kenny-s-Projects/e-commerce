import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useT } from '../../i18n/lang.js'
import { trackedOrders } from '../../data/account.js'
import { getProduct, productGallery, whatsappFor } from '../../data/products.js'
import { ease, fadeUp, underline } from '../Compte/accountUi.jsx'

const TRIP_SECONDS = 20 * 60 // durée de référence d'une course, pour la barre de progression

/** Suivi d'une commande (#suivi/KC-0140) : arrivée estimée, étapes, récapitulatif */
export default function TrackingPage({ number }) {
  const t = useT()
  const order = trackedOrders[number]
  if (!order) return <NotFound number={number} />

  const enRoute = order.status === 'en_route'
  const concierge = whatsappFor(t('Bonjour, j’ai une question sur ma commande kclick {n}.', { n: order.number }))

  return (
    <div className="bg-white text-ink">
      {/* Bandeau Kyra : statut et arrivée estimée */}
      <section className="bg-kyra text-kyra-ink">
        <div className="mx-auto grid max-w-[1100px] gap-6 px-gutter pb-7 pt-[clamp(28px,4vw,64px)] max-sm:px-[22px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-16 lg:pb-14">
          <motion.div {...fadeUp()}>
            <p className="caps">{t('Commande {n}', { n: order.number })}</p>
            <h1 className="mt-4 text-[clamp(32px,4.2vw,56px)] font-light leading-[1.08] tracking-[-0.01em]">
              {t('Votre commande est')} <span className="accent">{t(enRoute ? 'en route' : 'en préparation')}</span>.
            </h1>
            {!enRoute && <p className="mt-4 max-w-md text-[15px] leading-[1.6] text-kyra-ink/80">{t('Nous vous prévenons dès qu’elle part en livraison.')}</p>}
          </motion.div>
          {enRoute && <Countdown minutes={order.etaMinutes} rider={order.rider} />}
        </div>
      </section>

      <div className="mx-auto grid max-w-[1100px] gap-10 px-gutter py-[clamp(28px,4vw,64px)] max-sm:px-[22px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        {/* Étapes */}
        <motion.ol aria-label={t('Étapes de la commande')} className="flex flex-col" {...fadeUp(0.1)}>
          {order.steps.map((s, i) => {
            const done = i < order.current
            const current = i === order.current
            const last = i === order.steps.length - 1
            return (
              <li key={s.label} className="relative flex items-start gap-4 pb-6 last:pb-0" aria-current={current ? 'step' : undefined}>
                {!last && <span aria-hidden className={`absolute left-[11px] top-6 h-[calc(100%-16px)] w-px ${done ? 'bg-ink' : 'bg-[#ddd7cb]'}`} />}
                <span aria-hidden className="relative grid size-6 shrink-0 place-items-center">
                  {current ? (
                    <span className="grid size-6 place-items-center rounded-full border-[3px] border-[#f4d2c0]">
                      <span className="size-3 rounded-full bg-kyra" />
                    </span>
                  ) : done ? (
                    <span className="size-3.5 rounded-full bg-ink" />
                  ) : (
                    <span className="size-5 rounded-full border-[3px] border-[#e3ddd2] bg-white" />
                  )}
                </span>
                <span className={`flex-1 pt-px text-[16px] ${done || current ? 'text-ink' : 'text-ink/45'}`}>{t(s.label)}</span>
                <span className="pt-0.5 font-mono text-[13px] text-ink/70">{s.time ?? ''}</span>
              </li>
            )
          })}
        </motion.ol>

        {/* Récapitulatif */}
        <motion.div className="flex flex-col gap-4" {...fadeUp(0.18)}>
          <section aria-label={t('Récapitulatif')} className="bg-[#f6efe8] p-[18px] md:p-7">
            <ul className="flex flex-col gap-4 border-b border-ink/10 pb-4">
              {order.items.map((it) => {
                const p = getProduct(it.productId)
                const img = p ? productGallery(p)[0] : null
                return (
                  <li key={it.productId} className="flex items-center gap-4">
                    <span className="block size-[62px] shrink-0 overflow-hidden bg-white p-1.5">
                      {img ? <img src={img} alt="" className="block h-full w-full object-contain" /> : <span className="block size-full bg-kyra" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="caps text-[9px] text-ink/60">
                        {it.house} · {it.brand}
                      </p>
                      <p className="mt-1 text-[15px] leading-snug">{t(it.name)}</p>
                    </div>
                    <span className="font-mono text-[14px]">${it.price * it.qty}</span>
                  </li>
                )
              })}
            </ul>
            <dl className="mt-4 flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-ink/70">{t('Livraison à Gombe')}</dt>
                <dd className="font-mono">${order.delivery}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>{t('Payé en ligne ({p})', { p: t(order.payment) })}</dt>
                <dd className="font-mono">${order.total}</dd>
              </div>
            </dl>
          </section>
          <a href={concierge} target="_blank" rel="noreferrer" className="caps grid h-14 place-items-center bg-ink text-[11px] text-white transition-colors hover:bg-black">
            {t('Une question ? Conciergerie')}
          </a>
          <p className="text-[12px] text-ink/55">{t('Données de démonstration.')}</p>
        </motion.div>
      </div>
    </div>
  )
}

function Countdown({ minutes, rider }) {
  const t = useT()
  const [left, setLeft] = useState(minutes * 60)
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const progress = Math.min(1, Math.max(0.05, 1 - left / TRIP_SECONDS))

  return (
    <motion.div {...fadeUp(0.1)}>
      <p className="text-[14px]">{left > 0 ? t('Arrivée estimée dans') : t('Arrivée imminente')}</p>
      <p className="mt-1 font-mono text-[clamp(56px,7vw,88px)] font-normal leading-none tracking-[-0.04em] tabular-nums" aria-live="off">
        {mm}
        <span className="mx-0.5">:</span>
        {ss}
      </p>
      <div className="mt-5 h-1 overflow-hidden bg-kyra-ink/15" role="progressbar" aria-label={t('Progression de la livraison')} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className="h-full bg-kyra-ink" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.8, ease }} />
      </div>
      <p className="mt-4 flex items-center gap-3 text-[14px]">
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="5.5" cy="16.5" r="3" />
          <circle cx="18.5" cy="16.5" r="3" />
          <path d="M5.5 16.5 9 10h5l4.5 6.5M9 10 7.5 7H5.5M14 10l-1.5-3H15" />
        </svg>
        {t('{r} arrive à moto. Le temps est donné par le livreur.', { r: rider })}
      </p>
    </motion.div>
  )
}

function NotFound({ number }) {
  const t = useT()
  return (
    <section className="grid min-h-[calc(100svh-4rem)] place-items-center bg-white px-gutter py-20 text-center text-ink">
      <motion.div className="max-w-[480px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
        <p className="caps text-[#86671f]">{t('Suivi de commande')}</p>
        <h1 className="mt-4 text-[clamp(32px,4vw,46px)] font-light leading-tight">
          {t('Commande')} <span className="accent">{t('introuvable.')}</span>
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-ink/70">
          {t('Nous ne trouvons pas la commande {n}. Vérifiez le numéro reçu par e-mail, ou écrivez à la conciergerie.', { n: number || '—' })}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-[14px]">
          <a href="#compte/profil" className={underline}>
            {t('Mes commandes')}
          </a>
          <a href={whatsappFor(t('Bonjour, je souhaite suivre ma commande kclick {n}.', { n: number }))} target="_blank" rel="noreferrer" className={underline}>
            {t('Écrire à la conciergerie')}
          </a>
        </div>
      </motion.div>
    </section>
  )
}
