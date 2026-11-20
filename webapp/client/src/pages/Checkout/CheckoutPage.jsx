import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import Reveal from '../../components/maison/Reveal.jsx'
import { formatPrice, productImages } from '../../data/houses.js'
import { whatsappFor } from '../../data/products.js'
import { contact } from '../../data/home.js'
import { api } from '../../lib/api.js'
import { rememberOrder } from '../../lib/orderMemory.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]
const DEFAULT_FEE = 4 // Gombe, le jour même (remplacé par les paramètres de l'API)

const PAYMENT = [
  { id: 'mobile_money', title: 'Mobile money', text: 'Validez le paiement sur votre téléphone' },
  { id: 'carte', title: 'Carte bancaire', text: 'Visa, Mastercard · paiement sécurisé' },
]

const DEFAULT_OPERATORS = ['M-Pesa', 'Orange Money', 'Airtel Money']
const PHONE = /^\+?[0-9 ]{8,20}$/
const cleanPhone = (v) => v.replace(/[^\d+ ]/g, '').replace(/\s+/g, ' ').trim()

// Motifs renvoyés par l'API pour un article (CART_INVALID)
const ITEM_PROBLEMS = {
  COMING_SOON: 'Bientôt disponible',
  OUT_OF_STOCK: 'Stock insuffisant',
  UNAVAILABLE: 'Article indisponible',
  NO_PRICE: 'Prix à venir',
}

/**
 * Commande sur un écran (#checkout) : 1. Coordonnées · 2. Livraison ou retrait · 3. Paiement en ligne
 * (mobile money ou carte ; pas de paiement à la livraison), récapitulatif collé à droite, puis confirmation.
 * Sans compte. La commande est créée par l'API (POST /orders) : prix et stock vérifiés par le serveur.
 *  items     : [{ product, qty }] à commander (tout le panier, ou un seul article « Commander maintenant »)
 *  fromCart  : true si la commande vient du panier (il est vidé après confirmation)
 *  onDone    : appelé à la confirmation
 */
export default function CheckoutPage({ items, fromCart, onDone }) {
  const t = useT()
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', quartier: '', commune: 'Gombe', notes: '', operator: DEFAULT_OPERATORS[0], momo: '' })
  const [delivery, setDelivery] = useState('livraison')
  const [payment, setPayment] = useState('mobile_money')
  const [errors, setErrors] = useState({})
  const [order, setOrder] = useState(null)
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState(null) // { message, items: { variantId: motif } }
  const [settings, setSettings] = useState(null)

  // Zones et frais de livraison, opérateurs mobile money (Paramètres › Livraison / Paiements)
  useEffect(() => {
    let alive = true
    api
      .get('/settings/public', undefined, { auth: false })
      .then((s) => alive && setSettings(s))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  const zones = settings?.delivery?.zones?.length ? settings.delivery.zones : [{ commune: 'Gombe', fee: DEFAULT_FEE, delay: 'Le jour même' }]
  const zone = zones.find((z) => z.commune === form.commune) ?? zones[0]
  const operators = settings?.payments?.mobileMoney?.length ? settings.payments.mobileMoney : DEFAULT_OPERATORS
  const payments = PAYMENT.filter((p) => !settings || (p.id === 'carte' ? settings.payments?.card : settings.payments?.mobileMoney?.length))

  const DELIVERY = [
    { id: 'livraison', title: t('Livraison à {c}', { c: zone.commune }), text: zone.delay ? t('{d}, à moto', { d: t(zone.delay) }) : t('À moto'), price: zone.fee },
    { id: 'retrait', title: t('Retrait en boutique'), text: t('Gratuit, dès 9h00 · 124 Boulevard du 30 Juin, Gombe'), price: 0 },
  ]

  const subtotal = Math.round(items.reduce((s, l) => s + (l.product.price ?? 0) * l.qty, 0) * 100) / 100
  const fee = delivery === 'livraison' ? zone.fee : 0
  const total = Math.round((subtotal + fee) * 100) / 100
  const count = items.reduce((n, l) => n + l.qty, 0)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const required = useMemo(() => {
    const r = ['name', 'phone']
    if (delivery === 'livraison') r.push('address')
    if (payment === 'mobile_money') r.push('momo')
    return r
  }, [delivery, payment])

  const submit = async (e) => {
    e.preventDefault()
    if (sending) return
    const errs = Object.fromEntries(required.filter((k) => !form[k].trim()).map((k) => [k, 'Champ obligatoire']))
    for (const k of ['phone', 'momo']) if (!errs[k] && required.includes(k) && !PHONE.test(cleanPhone(form[k]))) errs[k] = 'Numéro invalide'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'E-mail invalide'
    setErrors(errs)
    setServerError(null)
    if (Object.keys(errs).length) {
      document.getElementById(`co-${Object.keys(errs)[0]}`)?.focus()
      return
    }

    const phone = cleanPhone(form.phone)
    const body = {
      customer: { name: form.name.trim(), phone, email: form.email.trim() || undefined },
      mode: delivery,
      address:
        delivery === 'livraison'
          ? { commune: zone.commune, street: form.address.trim(), quartier: form.quartier.trim() || undefined, landmark: form.notes.trim() || undefined }
          : undefined,
      paymentMethod: payment,
      provider: payment === 'mobile_money' ? form.operator : undefined,
      payerPhone: payment === 'mobile_money' ? cleanPhone(form.momo) : undefined,
      items: items.map(({ product, qty }) => ({ variantId: product.variantId, quantity: qty, giftMessage: product.giftMessage || undefined })),
    }

    setSending(true)
    try {
      const created = await api.post('/orders', body)
      rememberOrder(created.number, phone)
      setOrder({ number: created.number, total: created.total, count, delivery, payment, name: form.name.trim().split(' ')[0] })
      onDone?.(fromCart)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const byItem = Object.fromEntries((Array.isArray(err.details) ? err.details : []).filter((d) => d.variantId).map((d) => [d.variantId, d]))
      const fields = Array.isArray(err.details) ? err.details.filter((d) => d.field) : []
      setServerError({ message: err.message, items: byItem, fields })
    } finally {
      setSending(false)
    }
  }

  /* ---------- Confirmation ---------- */
  if (order) {
    const follow = whatsappFor(t('Bonjour, je souhaite suivre ma commande kclick {n}.', { n: order.number }))
    const momo = order.payment === 'mobile_money'
    return (
      <section className="grid min-h-[calc(100svh-4rem)] place-items-center bg-cream px-gutter py-20 text-center text-ink">
        <m.div className="max-w-[560px]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
          <m.span
            className="mx-auto grid size-16 place-items-center rounded-full bg-ink text-2xl text-cream"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            aria-hidden
          >
            ✓
          </m.span>
          <h1 className="mt-8 text-[clamp(44px,6vw,80px)] font-light leading-none">
            {t('Merci')}{order.name ? ',' : '.'} <span className="accent">{order.name ? `${order.name}.` : ''}</span>
          </h1>
          <p className="mt-6 text-[15px] leading-[1.75] text-ink/75">
            {t('Votre commande {n} est enregistrée.', { n: order.number })}{' '}
            {order.delivery === 'livraison' ? t('Elle vous sera livrée aujourd’hui à Gombe.') : t('Elle vous attend en boutique, dès 9h00.')}
          </p>
          <p className="mx-auto mt-4 max-w-[460px] rounded-xl bg-white/70 px-5 py-4 text-[13px] leading-relaxed text-ink/80">
            {momo
              ? t('Paiement en attente : validez la demande mobile money sur votre téléphone. La préparation commence dès que le paiement est confirmé.')
              : t('Paiement en attente : vous serez redirigé vers le paiement sécurisé par carte [prestataire à brancher].')}
          </p>
          <p className="caps mt-8 text-gold">{t('Numéro de commande')}</p>
          <p className="mt-2 text-[32px] font-light tracking-wide">{order.number}</p>
          <p className="mt-2 text-[13px] text-ink/60">
            {t('{n} article(s)', { n: order.count })} · {t('Total')} {formatPrice(order.total)}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href={`#suivi/${order.number}`} className="rounded-full bg-ink px-7 py-4 text-[14px] text-white">{t('Suivre ma commande')}</a>
            <a href={follow} target="_blank" rel="noreferrer" className="rounded-full border border-ink px-7 py-4 text-[14px]">{t('Une question sur WhatsApp')}</a>
          </div>
          <a href="#" className="caps mt-8 inline-block border-b border-current pb-1 text-[10px]">{t('Retour à l’accueil')}</a>
        </m.div>
      </section>
    )
  }

  /* ---------- Panier vide ---------- */
  if (!items.length) {
    return (
      <section className="grid min-h-[60svh] place-items-center px-gutter py-20 text-center text-ink">
        <div>
          <h1 className="text-[clamp(36px,4vw,56px)] font-light">{t('Rien à commander')} <span className="accent">{t('pour l’instant.')}</span></h1>
          <a href="#" className="caps mt-8 inline-block border-b border-current pb-1">{t('Découvrir les Maisons')}</a>
        </div>
      </section>
    )
  }

  /* ---------- Formulaire ---------- */
  const field = (k, label, props = {}) => (
    <div className={props.wide ? 'col-span-2 max-sm:col-span-1' : ''}>
      <label htmlFor={`co-${k}`} className="mb-1.5 block text-[12px]">
        {t(label)} {required.includes(k) && <span className="text-celio">*</span>}
      </label>
      <input
        id={`co-${k}`}
        value={form[k]}
        onChange={set(k)}
        aria-invalid={errors[k] || undefined}
        {...Object.fromEntries(Object.entries(props).filter(([p]) => p !== 'wide'))}
        className={`h-12 w-full rounded-lg border bg-white px-4 text-[14px] outline-none transition-colors focus:border-ink ${errors[k] ? 'border-celio' : 'border-ink/20'}`}
      />
      {errors[k] && <p className="mt-1 text-[11px] text-celio">{t(errors[k])}</p>}
    </div>
  )

  return (
    <div className="bg-white text-ink">
      <section className="px-gutter pb-6 pt-[clamp(40px,5vw,72px)]">
        <a href="#" className="text-[12px] text-ink/60 hover:text-ink">← {t('Continuer mes achats')}</a>
        <Reveal as="h1" className="mt-4 text-[clamp(40px,5vw,72px)] font-light leading-none">
          {t('Votre')} <span className="accent">{t('commande')}</span>
        </Reveal>
        <p className="mt-3 text-[13px] text-ink/60">{t('Sans compte · Paiement en ligne par mobile money ou carte')}</p>
      </section>

      <form noValidate onSubmit={submit} className="flex flex-wrap items-start gap-[clamp(32px,5vw,72px)] px-gutter pb-[clamp(72px,8vw,120px)]">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-12">
          {/* 1. Coordonnées */}
          <Step n="1" title={t('Vos coordonnées')}>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              {field('name', 'Prénom et nom', { autoComplete: 'name', wide: true })}
              {field('phone', 'Téléphone', { type: 'tel', autoComplete: 'tel', placeholder: '+243 …' })}
              {field('email', 'E-mail (facultatif)', { type: 'email', autoComplete: 'email' })}
            </div>
          </Step>

          {/* 2. Livraison ou retrait */}
          <Step n="2" title={t('Livraison ou retrait')}>
            <Choices options={DELIVERY} value={delivery} onChange={setDelivery} name="delivery" t={t} showPrice />
            <AnimatePresence initial={false}>
              {delivery === 'livraison' && (
                <m.div key="addr" className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease }}>
                  <div className="grid grid-cols-2 gap-4 pt-5 max-sm:grid-cols-1">
                    {field('address', 'Adresse de livraison', { autoComplete: 'street-address', wide: true, placeholder: t('Avenue, numéro') })}
                    {zones.length > 1 ? (
                      <div>
                        <label htmlFor="co-commune" className="mb-1.5 block text-[12px]">{t('Commune')}</label>
                        <select id="co-commune" value={zone.commune} onChange={set('commune')} className="h-12 w-full rounded-lg border border-ink/20 bg-white px-4 text-[14px]">
                          {zones.map((z) => <option key={z.commune} value={z.commune}>{z.commune} · {formatPrice(z.fee)}</option>)}
                        </select>
                      </div>
                    ) : (
                      field('commune', 'Commune', { readOnly: true })
                    )}
                    {field('quartier', 'Quartier (facultatif)')}
                    {field('notes', 'Point de repère pour le livreur (facultatif)', { wide: true, placeholder: t('Ex. portail bleu, en face de la pharmacie') })}
                  </div>
                  <p className="mt-3 text-[12px] text-ink/60">{t('Livraison hors de Gombe : [à confirmer]. Écrivez au concierge pour une autre commune.')}</p>
                </m.div>
              )}
            </AnimatePresence>
          </Step>

          {/* 3. Paiement */}
          <Step n="3" title={t('Paiement')}>
            <Choices options={payments} value={payment} onChange={setPayment} name="payment" t={t} />
            <AnimatePresence mode="wait" initial={false}>
              {payment === 'mobile_money' && (
                <m.div key="mobile" className="grid grid-cols-2 gap-4 pt-5 max-sm:grid-cols-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
                  <div>
                    <label htmlFor="co-operator" className="mb-1.5 block text-[12px]">{t('Opérateur')}</label>
                    <select id="co-operator" value={form.operator} onChange={set('operator')} className="h-12 w-full rounded-lg border border-ink/20 bg-white px-4 text-[14px]">
                      {operators.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  {field('momo', 'Numéro mobile money', { type: 'tel', placeholder: '+243 …' })}
                  <p className="col-span-2 text-[12px] text-ink/60 max-sm:col-span-1">{t('Vous recevrez une demande de validation sur ce numéro.')}</p>
                </m.div>
              )}
              {payment === 'carte' && (
                <m.p key="carte" className="pt-5 text-[13px] leading-relaxed text-ink/70" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
                  {t('Vous serez redirigé vers le paiement sécurisé pour saisir votre carte [prestataire à brancher]. Aucune donnée de carte ne passe par kclick.')}
                </m.p>
              )}
            </AnimatePresence>
          </Step>
        </div>

        {/* Récapitulatif */}
        <aside className="flex max-w-[460px] flex-[1_1_360px] flex-col gap-5 rounded-2xl bg-cream p-7 md:sticky md:top-24 max-md:max-w-none">
          <p className="caps">{t('Récapitulatif')} · {t('{n} article(s)', { n: count })}</p>
          <ul className="flex flex-col gap-4">
            {items.map(({ product, qty }) => {
              const img = productImages(product)[0]
              return (
                <li key={product.id} className="flex items-center gap-4">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-white">
                    {img && <img loading="lazy" decoding="async" src={img} alt="" className={`absolute inset-0 m-auto ${product.boxed || product.images ? 'size-full object-cover' : 'size-[80%] object-contain mix-blend-multiply'}`} />}
                    <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-ink text-[10px] text-white">{qty}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="caps block text-[9px] opacity-60">{product.house?.name ?? product.store}</span>
                    <span className="block text-[13px] leading-snug">
                      {t(product.productName ?? product.name)}
                      {product.variantLabel && <span className="text-ink/60"> · {product.variantLabel}</span>}
                    </span>
                    {serverError?.items[product.variantId] && (
                      <span className="mt-0.5 block text-[11px] text-celio">
                        {t(ITEM_PROBLEMS[serverError.items[product.variantId].code] ?? 'Article indisponible')}
                        {serverError.items[product.variantId].available != null && ` · ${t('{n} disponible(s)', { n: serverError.items[product.variantId].available })}`}
                      </span>
                    )}
                  </span>
                  <span className="text-[13px]">{formatPrice(Math.round((product.price ?? 0) * qty * 100) / 100)}</span>
                </li>
              )
            })}
          </ul>
          <div className="flex flex-col gap-2 border-t border-ink/15 pt-4 text-[14px]">
            <p className="flex justify-between"><span>{t('Sous-total')}</span><span>{formatPrice(subtotal)}</span></p>
            <p className="flex justify-between"><span>{delivery === 'livraison' ? t('Livraison') : t('Retrait')}</span><span>{fee ? formatPrice(fee) : t('Gratuit')}</span></p>
          </div>
          <p className="flex items-baseline justify-between border-t border-ink pt-4">
            <span className="text-[15px]">{t('Total')}</span>
            <m.span key={total} className="text-[32px] font-light" initial={{ opacity: 0.4, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
              {formatPrice(total)}
            </m.span>
          </p>
          {serverError && (
            <div role="alert" className="rounded-xl border border-celio/40 bg-white px-4 py-3 text-[13px] text-celio">
              <p>{t(serverError.message)}</p>
              {serverError.fields.map((f) => (
                <p key={f.field} className="mt-1 text-[12px]">· {t(f.message)}</p>
              ))}
            </div>
          )}
          <m.button type="submit" disabled={sending} whileTap={{ scale: 0.98 }} className="h-14 rounded-full bg-ink text-[14px] text-white transition-opacity hover:opacity-90 disabled:opacity-60">
            {sending ? t('Envoi de la commande…') : t('Payer {p}', { p: formatPrice(total) })}
          </m.button>
          {fromCart && <p className="text-center text-[12px] text-ink/60">{t('Pour modifier les quantités, ouvrez le panier.')}</p>}
          <p className="text-center text-[11px] text-ink/50">
            {t('Une question ?')} <a href={whatsappFor(t('Bonjour, j’ai une question sur ma commande kclick.'))} target="_blank" rel="noreferrer" className="underline">{t('Le concierge vous répond sur WhatsApp')}</a> · {contact.email}
          </p>
        </aside>
      </form>
    </div>
  )
}

function Step({ n, title, children }) {
  return (
    <m.fieldset initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: Number(n) * 0.08, ease }}>
      <legend className="mb-5 flex items-center gap-3 text-[22px] font-light">
        <span className="grid size-8 place-items-center rounded-full border border-ink text-[13px]">{n}</span>
        {title}
      </legend>
      {children}
    </m.fieldset>
  )
}

// Choix sous forme de cartes radio (livraison, paiement)
function Choices({ options, value, onChange, name, t, showPrice = false }) {
  return (
    <div role="radiogroup" className="grid gap-3">
      {options.map((o) => {
        const on = o.id === value
        return (
          <label key={o.id} className={`relative flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${on ? 'border-ink' : 'border-ink/15 hover:border-ink/40'}`}>
            <input type="radio" name={name} value={o.id} checked={on} onChange={() => onChange(o.id)} className="size-4 accent-ink" />
            <span className="flex-1">
              <span className="block text-[15px]">{t(o.title)}</span>
              <span className="block text-[12px] text-ink/60">{t(o.text)}</span>
            </span>
            {showPrice && <span className="text-[14px]">{o.price ? formatPrice(o.price) : t('Gratuit')}</span>}
          </label>
        )
      })}
    </div>
  )
}
