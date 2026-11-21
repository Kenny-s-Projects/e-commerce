import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import Reveal from '../../components/maison/Reveal.jsx'
import { formatPrice, productImages } from '../../data/houses.js'
import { whatsappFor } from '../../data/products.js'
import { contact } from '../../data/home.js'
import { api } from '../../lib/api.js'
import { rememberOrder } from '../../lib/orderMemory.js'
import { getAccessToken } from '../../lib/supabase.js'
import { useT } from '../../i18n/lang.js'
import useLiteMode from '../../hooks/useLiteMode.js'

const ease = [0.22, 1, 0.36, 1]
const DEFAULT_FEE = 4 // Gombe, le jour même (remplacé par les paramètres de l'API)
const PHONE_HINT_DELAY = 10000 // « Validez le paiement sur votre téléphone » après 10 s d'attente

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

// Les 3 étapes et les champs que chacune contrôle
const STEPS = [
  { n: 1, title: 'Vos coordonnées', short: 'Coordonnées', fields: ['name', 'phone', 'email'] },
  { n: 2, title: 'Livraison ou retrait', short: 'Livraison', fields: ['address'] },
  { n: 3, title: 'Paiement', short: 'Paiement', fields: ['momo'] },
]

// Champ renvoyé par l'API → champ du formulaire (pour afficher l'erreur sous le bon champ)
const SERVER_FIELDS = { 'customer.name': 'name', 'customer.phone': 'phone', 'customer.email': 'email', 'address.street': 'address', 'address.commune': 'address', address: 'address', payerPhone: 'momo' }

// Champ renvoyé par l'API (ex. « customer.phone », « payerPhone ») → étape à rouvrir
function stepOfServerField(field = '') {
  if (field.startsWith('customer')) return 1
  if (field.startsWith('address') || field === 'mode') return 2
  if (['paymentMethod', 'provider', 'payerPhone'].some((f) => field.startsWith(f))) return 3
  return null
}

/**
 * Commande (#checkout) en 3 étapes : 1. Coordonnées · 2. Livraison ou retrait · 3. Paiement en ligne
 * (mobile money ou carte ; pas de paiement à la livraison), récapitulatif collé à droite, puis confirmation.
 * Une étape validée (« Continuer ») se replie en un résumé avec une coche ; la suivante s'ouvre.
 * Sans compte. La commande est créée par l'API (POST /orders) : prix et stock vérifiés par le serveur.
 * Aucun prestataire de paiement n'est encore branché : la confirmation porte sur la COMMANDE,
 * le paiement reste « en attente de confirmation ».
 *  items     : [{ product, qty }] à commander (tout le panier, ou un seul article « Commander maintenant »)
 *  fromCart  : true si la commande vient du panier (il est vidé après confirmation)
 *  onDone    : appelé à la confirmation
 */
// Dernière adresse de livraison utilisée sur cet appareil (gardée dans le navigateur seulement)
const ADDRESS_KEY = 'kclick-last-address'
const ADDRESS_FIELDS = ['address', 'quartier', 'commune', 'notes']
function readLastAddress() {
  try {
    const a = JSON.parse(localStorage.getItem(ADDRESS_KEY) ?? 'null')
    return a && typeof a === 'object' ? a : null
  } catch {
    return null
  }
}
function saveLastAddress(form) {
  try {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, form[k] ?? '']))))
  } catch {
    /* stockage indisponible : l'adresse ne sera pas proposée la prochaine fois */
  }
}
// Ne remplit que les champs encore vides : ce que la personne a déjà tapé n'est jamais écrasé
const fillEmpty = (form, values) => {
  const next = { ...form }
  for (const [k, v] of Object.entries(values)) if (v && !String(form[k] ?? '').trim()) next[k] = v
  return next
}

export default function CheckoutPage({ items, fromCart, onDone }) {
  const t = useT()
  const lite = useLiteMode()
  const reduce = useReducedMotion() || lite
  const [form, setForm] = useState(() => {
    const empty = { name: '', phone: '', email: '', address: '', quartier: '', commune: 'Gombe', notes: '', operator: DEFAULT_OPERATORS[0], momo: '' }
    const last = readLastAddress()
    return last ? fillEmpty(empty, { address: last.address, quartier: last.quartier, notes: last.notes }) : empty
  })
  const [delivery, setDelivery] = useState('livraison')
  const [payment, setPayment] = useState('mobile_money')
  const [errors, setErrors] = useState({})
  const [order, setOrder] = useState(null)
  const [sending, setSending] = useState(false)
  const [longWait, setLongWait] = useState(false) // paiement mobile money : plus de 10 s d'attente
  const [serverError, setServerError] = useState(null) // { message, items: { variantId: motif }, fields }
  const [settings, setSettings] = useState(null)
  const [open, setOpen] = useState(1) // étape ouverte
  const [done, setDone] = useState(() => new Set()) // étapes validées
  const sendingRef = useRef(false) // garde contre la double soumission
  const [focusTick, setFocusTick] = useState(0) // > 0 : l'utilisateur a changé d'étape → le focus suit

  // Client connecté : nom, téléphone et e-mail de son profil (supabase-js n'est pas chargé pour un visiteur sans session)
  useEffect(() => {
    let alive = true
    getAccessToken()
      .then((token) => (token ? api.get('/users/me') : null))
      .then((me) => {
        if (!alive || !me) return
        setForm((f) => fillEmpty(f, { name: me.fullName, phone: me.phone, email: me.email }))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

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

  // Le focus suit l'étape ouverte (seulement après une action de l'utilisateur)
  useEffect(() => {
    if (!focusTick) return
    const heading = document.getElementById(`co-step-${open}`)
    heading?.focus({ preventScroll: true })
    heading?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })
  }, [focusTick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Après 10 s d'attente d'un paiement mobile money : rappeler de valider sur le téléphone
  useEffect(() => {
    if (!sending || payment !== 'mobile_money') return
    const id = setTimeout(() => setLongWait(true), PHONE_HINT_DELAY)
    return () => clearTimeout(id)
  }, [sending, payment])

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

  // Erreurs de saisie d'une liste de champs (mêmes règles qu'avant le découpage en étapes)
  const validate = (keys) => {
    const errs = {}
    for (const k of keys) {
      if (required.includes(k) && !form[k].trim()) errs[k] = 'Champ obligatoire'
      else if ((k === 'phone' || k === 'momo') && required.includes(k) && !PHONE.test(cleanPhone(form[k]))) errs[k] = 'Numéro invalide'
      else if (k === 'email' && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'E-mail invalide'
    }
    return errs
  }

  const goTo = (n) => {
    setOpen(n)
    setFocusTick((x) => x + 1)
  }

  // « Continuer » : valide l'étape, la replie, ouvre la suivante non validée
  const continueFrom = (n) => {
    const keys = STEPS[n - 1].fields
    const errs = validate(keys)
    setErrors((e) => ({ ...Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))), ...errs }))
    if (Object.keys(errs).length) {
      document.getElementById(`co-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const next = new Set(done).add(n)
    setDone(next)
    goTo(STEPS.find((s) => !next.has(s.n))?.n ?? 3)
  }

  const pay = async () => {
    if (sendingRef.current) return
    // Toutes les étapes sont revérifiées ; la première étape en erreur se rouvre
    const errs = validate(STEPS.flatMap((s) => s.fields))
    setErrors(errs)
    setServerError(null)
    if (Object.keys(errs).length) {
      const first = STEPS.find((s) => s.fields.some((f) => errs[f]))
      if (first) goTo(first.n)
      setTimeout(() => document.getElementById(`co-${Object.keys(errs)[0]}`)?.focus(), 50)
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

    sendingRef.current = true
    setSending(true)
    setLongWait(false)
    try {
      const created = await api.post('/orders', body)
      rememberOrder(created.number, phone)
      if (delivery === 'livraison') saveLastAddress(form)
      setOrder({ number: created.number, total: created.total, count, delivery, payment, name: form.name.trim().split(' ')[0] })
      onDone?.(fromCart) // le panier n'est vidé qu'ici, une fois la commande enregistrée
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    } catch (err) {
      const byItem = Object.fromEntries((Array.isArray(err.details) ? err.details : []).filter((d) => d.variantId).map((d) => [d.variantId, d]))
      const fields = Array.isArray(err.details) ? err.details.filter((d) => d.field) : []
      setServerError({ message: err.message, items: byItem, fields })
      // Une erreur de saisie renvoyée par le serveur s'affiche sous le champ et rouvre l'étape concernée
      const fieldErrors = Object.fromEntries(fields.filter((f) => SERVER_FIELDS[f.field]).map((f) => [SERVER_FIELDS[f.field], f.message]))
      if (Object.keys(fieldErrors).length) setErrors((e) => ({ ...e, ...fieldErrors }))
      const step = fields.map((f) => stepOfServerField(f.field)).find(Boolean)
      if (step && step !== 3) goTo(step)
    } finally {
      sendingRef.current = false
      setSending(false)
      setLongWait(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (open < 3) continueFrom(open)
    else pay()
  }

  /* ---------- Confirmation ---------- */
  if (order) {
    const follow = whatsappFor(t('Bonjour, je souhaite suivre ma commande kclick {n}.', { n: order.number }))
    const momo = order.payment === 'mobile_money'
    return (
      <section className="grid min-h-[calc(100svh-4rem)] place-items-center bg-cream px-gutter py-20 text-center text-ink">
        <m.div className="max-w-[560px]" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <DrawnCheck reduce={reduce} />
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
          {/* Le numéro apparaît une fois la coche dessinée */}
          <m.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: reduce ? 0 : 0.75, ease }}>
            <p className="caps mt-8 text-gold">{t('Numéro de commande')}</p>
            <p className="mt-2 text-[32px] font-light tracking-wide">{order.number}</p>
            <p className="mt-2 text-[13px] text-ink/60">
              {t('{n} article(s)', { n: order.count })} · {t('Total')} {formatPrice(order.total)}
            </p>
          </m.div>
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
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `co-${k}-err` : undefined}
        {...Object.fromEntries(Object.entries(props).filter(([p]) => p !== 'wide'))}
        className={`h-12 w-full rounded-lg border bg-white px-4 text-[14px] outline-none transition-colors focus:border-ink ${errors[k] ? 'border-celio' : 'border-ink/20'}`}
      />
      {errors[k] && <p id={`co-${k}-err`} className="mt-1 text-[11px] text-celio">{t(errors[k])}</p>}
    </div>
  )

  // Résumé d'une étape validée (affiché quand elle est repliée)
  const summary = {
    1: [form.name.trim(), cleanPhone(form.phone), form.email.trim()].filter(Boolean).join(' · '),
    2:
      delivery === 'livraison'
        ? `${t('Livraison à {c}', { c: zone.commune })} · ${[form.address.trim(), form.quartier.trim()].filter(Boolean).join(', ')}`
        : `${t('Retrait en boutique')} · 124 Boulevard du 30 Juin, Gombe`,
  }

  const stepProps = (n) => ({
    step: STEPS[n - 1],
    open: open === n,
    done: done.has(n) && open !== n,
    summary: summary[n],
    onEdit: () => goTo(n),
    reduce,
    t,
  })

  return (
    <div className="bg-white text-ink">
      <section className="px-gutter pb-6 pt-[clamp(40px,5vw,72px)]">
        <a href="#" className="text-[12px] text-ink/60 hover:text-ink">← {t('Continuer mes achats')}</a>
        <Reveal as="h1" className="mt-4 text-[clamp(40px,5vw,72px)] font-light leading-none">
          {t('Votre')} <span className="accent">{t('commande')}</span>
        </Reveal>
        <p className="mt-3 text-[13px] text-ink/60">{t('Sans compte · Paiement en ligne par mobile money ou carte')}</p>
        <Progress open={open} done={done} t={t} />
      </section>

      <form noValidate onSubmit={submit} className="flex flex-wrap items-start gap-[clamp(32px,5vw,72px)] px-gutter pb-[clamp(72px,8vw,120px)]">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {/* 1. Coordonnées */}
          <Step {...stepProps(1)}>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              {field('name', 'Prénom et nom', { autoComplete: 'name', wide: true })}
              {field('phone', 'Téléphone', { type: 'tel', autoComplete: 'tel', placeholder: '+243 …' })}
              {field('email', 'E-mail (facultatif)', { type: 'email', autoComplete: 'email' })}
            </div>
            <ContinueButton t={t} />
          </Step>

          {/* 2. Livraison ou retrait */}
          <Step {...stepProps(2)}>
            <Choices options={DELIVERY} value={delivery} onChange={setDelivery} name="delivery" t={t} showPrice />
            {delivery === 'livraison' && (
              <m.div key="addr" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
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
            <ContinueButton t={t} />
          </Step>

          {/* 3. Paiement */}
          <Step {...stepProps(3)}>
            <Choices options={payments} value={payment} onChange={setPayment} name="payment" t={t} />
            {payment === 'mobile_money' && (
              <m.div key="mobile" className="grid grid-cols-2 gap-4 pt-5 max-sm:grid-cols-1" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
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
              <m.p key="carte" className="pt-5 text-[13px] leading-relaxed text-ink/70" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
                {t('Vous serez redirigé vers le paiement sécurisé pour saisir votre carte [prestataire à brancher]. Aucune donnée de carte ne passe par kclick.')}
              </m.p>
            )}

            {/* Payer : état « Paiement en cours… », barre de progression, rappel après 10 s, erreur + Réessayer */}
            <div className="mt-7 flex flex-col gap-3">
              <m.button
                type="submit"
                disabled={sending}
                aria-busy={sending}
                whileTap={sending ? undefined : { scale: 0.98 }}
                className="relative h-14 overflow-hidden rounded-full bg-ink text-[14px] text-white transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-80"
              >
                {sending ? t('Paiement en cours…') : t('Payer {p}', { p: formatPrice(total) })}
                {sending && <span className="pay-progress absolute inset-x-0 bottom-0 h-[3px] overflow-hidden" aria-hidden />}
              </m.button>
              <p aria-live="polite" className="min-h-[1.25rem] text-center text-[13px] text-ink/75">
                {sending && longWait && t('Validez le paiement sur votre téléphone.')}
              </p>
              <AnimatePresence>
                {serverError && !sending && (
                  <m.div
                    key="error"
                    role="alert"
                    className="rounded-xl border border-celio/40 bg-white px-4 py-3 text-[13px] text-celio"
                    initial={reduce ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                  >
                    <p>{t('La commande n’a pas pu être envoyée.')} {t(serverError.message)}</p>
                    {serverError.fields.map((f) => (
                      <p key={f.field} className="mt-1 text-[12px]">· {t(f.message)}</p>
                    ))}
                    {Object.keys(serverError.items).length > 0 && <p className="mt-1 text-[12px]">{t('Les articles concernés sont signalés dans le récapitulatif.')}</p>}
                    <p className="mt-1 text-[12px] text-ink/60">{t('Votre panier est conservé.')}</p>
                    <button type="button" onClick={pay} className="mt-3 rounded-full border border-celio px-5 py-2 text-[13px] transition-colors hover:bg-celio hover:text-white">
                      {t('Réessayer')}
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
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
            <m.span key={total} className="text-[32px] font-light" initial={reduce ? false : { opacity: 0.4, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
              {formatPrice(total)}
            </m.span>
          </p>
          {fromCart && <p className="text-center text-[12px] text-ink/60">{t('Pour modifier les quantités, ouvrez le panier.')}</p>}
          <p className="text-center text-[11px] text-ink/50">
            {t('Une question ?')} <a href={whatsappFor(t('Bonjour, j’ai une question sur ma commande kclick.'))} target="_blank" rel="noreferrer" className="underline">{t('Le concierge vous répond sur WhatsApp')}</a> · {contact.email}
          </p>
        </aside>
      </form>
    </div>
  )
}

// Indicateur d'avancement : 1 Coordonnées · 2 Livraison · 3 Paiement
function Progress({ open, done, t }) {
  return (
    <ol className="mt-7 flex max-w-[560px] items-center gap-2 text-[12px]" aria-label={t('Étapes de la commande')}>
      {STEPS.map((s, i) => {
        const current = open === s.n
        const ok = done.has(s.n) && !current
        return (
          <li key={s.n} className="flex flex-1 items-center gap-2" aria-current={current ? 'step' : undefined}>
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border text-[11px] transition-colors duration-300 ${
                current ? 'border-ink bg-ink text-white' : ok ? 'border-ink text-ink' : 'border-ink/25 text-ink/45'
              }`}
            >
              {ok ? '✓' : s.n}
            </span>
            <span className={`whitespace-nowrap transition-colors duration-300 ${current ? 'text-ink' : 'text-ink/55'}`}>
              {t(s.short)}
              <span className="sr-only">{ok ? ` (${t('validée')})` : current ? ` (${t('en cours')})` : ''}</span>
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className="h-px min-w-3 flex-1 bg-ink/15" />}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Une étape : ouverte (champs), repliée validée (résumé + coche + « Modifier ») ou à venir.
 * Le passage de l'un à l'autre est un fondu court (opacity + translation), sans animation de hauteur.
 */
function Step({ step, open, done, summary, onEdit, reduce, t, children }) {
  return (
    <fieldset className={`min-w-0 rounded-2xl border px-[clamp(16px,2.4vw,28px)] py-5 transition-colors duration-300 ${open ? 'border-ink/20' : 'border-ink/10'}`}>
      <legend className="sr-only">{t(step.title)}</legend>
      <div className="flex items-center gap-3">
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full border text-[13px] transition-colors duration-300 ${
            done ? 'border-ink bg-ink text-white' : open ? 'border-ink' : 'border-ink/25 text-ink/45'
          }`}
          aria-hidden
        >
          {done ? <CheckMark reduce={reduce} /> : step.n}
        </span>
        <h2 id={`co-step-${step.n}`} tabIndex={-1} className={`flex-1 text-[22px] font-light outline-none ${open || done ? '' : 'text-ink/45'}`}>
          {t(step.title)}
        </h2>
        {done && (
          <button type="button" onClick={onEdit} className="text-[12px] underline underline-offset-4 hover:text-ink/70">
            {t('Modifier')}
            <span className="sr-only"> : {t(step.title)}</span>
          </button>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <m.div key="open" className="pt-5" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease }}>
            {children}
          </m.div>
        ) : done && summary ? (
          <m.p key="summary" className="truncate pl-11 pt-1 text-[13px] text-ink/65" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }}>
            {summary}
          </m.p>
        ) : null}
      </AnimatePresence>
    </fieldset>
  )
}

function ContinueButton({ t }) {
  return (
    <button type="submit" className="mt-6 h-12 rounded-full bg-ink px-8 text-[14px] text-white transition-opacity hover:opacity-90">
      {t('Continuer')}
    </button>
  )
}

// Coche qui se dessine (étape validée)
function CheckMark({ reduce }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <m.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease }} />
    </svg>
  )
}

// Grande coche de la confirmation : le cercle puis le trait se dessinent
function DrawnCheck({ reduce }) {
  return (
    <svg viewBox="0 0 64 64" className="mx-auto size-16 text-ink" fill="none" aria-hidden>
      <m.circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease }} />
      <m.path
        d="M20 33l8 8 16-17"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: reduce ? 0 : 0.35, ease }}
      />
    </svg>
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
