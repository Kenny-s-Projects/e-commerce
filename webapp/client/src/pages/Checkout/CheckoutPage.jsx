import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Reveal from '../../components/maison/Reveal.jsx'
import { formatPrice, productImages } from '../../data/houses.js'
import { whatsappFor } from '../../data/products.js'
import { contact } from '../../data/home.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]
const DELIVERY_FEE = 4

const DELIVERY = [
  { id: 'livraison', title: 'Livraison à Gombe', text: 'Le jour même, à moto', price: DELIVERY_FEE },
  { id: 'retrait', title: 'Retrait en boutique', text: 'Gratuit, dès 9h00 · 124 Boulevard du 30 Juin, Gombe', price: 0 },
]

const PAYMENT = [
  { id: 'mobile', title: 'Mobile money', text: 'Validez le paiement sur votre téléphone' },
  { id: 'carte', title: 'Carte bancaire', text: 'Visa, Mastercard [à confirmer]' },
  { id: 'livraison', title: 'Paiement à la livraison', text: 'En espèces ou mobile money, à la remise de la commande' },
]

// Opérateurs proposés dans le prototype, à confirmer avec le prestataire de paiement
const OPERATORS = ['M-Pesa', 'Orange Money', 'Airtel Money']

/**
 * Commande sur un écran (#checkout) : 1. Coordonnées · 2. Livraison ou retrait · 3. Paiement
 * (mobile money, carte, ou à la livraison), récapitulatif collé à droite, puis écran de confirmation.
 * Sans compte. Prototype : aucun paiement n'est débité.
 *  items     : [{ product, qty }] à commander (tout le panier, ou un seul article « Commander maintenant »)
 *  fromCart  : true si la commande vient du panier (il est vidé après confirmation)
 *  onDone    : appelé à la confirmation
 */
export default function CheckoutPage({ items, fromCart, onDone }) {
  const t = useT()
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', commune: 'Gombe', notes: '', operator: OPERATORS[0], momo: '', card: '', expiry: '', cvc: '', cardName: '' })
  const [delivery, setDelivery] = useState('livraison')
  const [payment, setPayment] = useState('mobile')
  const [errors, setErrors] = useState({})
  const [order, setOrder] = useState(null)

  const subtotal = items.reduce((s, l) => s + (l.product.price ?? 0) * l.qty, 0)
  const fee = DELIVERY.find((d) => d.id === delivery).price
  const total = subtotal + fee
  const count = items.reduce((n, l) => n + l.qty, 0)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const required = useMemo(() => {
    const r = ['name', 'phone']
    if (delivery === 'livraison') r.push('address')
    if (payment === 'mobile') r.push('momo')
    if (payment === 'carte') r.push('card', 'expiry', 'cvc', 'cardName')
    return r
  }, [delivery, payment])

  const submit = (e) => {
    e.preventDefault()
    const errs = Object.fromEntries(required.filter((k) => !form[k].trim()).map((k) => [k, true]))
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`co-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const number = `KC-${Date.now().toString(36).slice(-6).toUpperCase()}`
    setOrder({ number, items, total, fee, delivery, payment, name: form.name.trim().split(' ')[0] })
    onDone?.(fromCart)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ---------- Confirmation ---------- */
  if (order) {
    const follow = whatsappFor(t('Bonjour, je souhaite suivre ma commande kclick {n}.', { n: order.number }))
    return (
      <section className="grid min-h-[calc(100svh-4rem)] place-items-center bg-cream px-gutter py-20 text-center text-ink">
        <motion.div className="max-w-[560px]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
          <motion.span
            className="mx-auto grid size-16 place-items-center rounded-full bg-ink text-2xl text-cream"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            aria-hidden
          >
            ✓
          </motion.span>
          <h1 className="mt-8 text-[clamp(44px,6vw,80px)] font-light leading-none">
            {t('Merci')}{order.name ? ',' : '.'} <span className="accent">{order.name ? `${order.name}.` : ''}</span>
          </h1>
          <p className="mt-6 text-[15px] leading-[1.75] text-ink/75">
            {t('Votre commande {n} est enregistrée.', { n: order.number })}{' '}
            {order.delivery === 'livraison' ? t('Elle vous sera livrée aujourd’hui à Gombe.') : t('Elle vous attend en boutique, dès 9h00.')}
          </p>
          <p className="caps mt-8 text-gold">{t('Numéro de commande')}</p>
          <p className="mt-2 text-[32px] font-light tracking-wide">{order.number}</p>
          <p className="mt-2 text-[13px] text-ink/60">
            {t('{n} article(s)', { n: order.items.reduce((s, l) => s + l.qty, 0) })} · {t('Total')} {formatPrice(order.total)}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href={follow} target="_blank" rel="noreferrer" className="rounded-full bg-ink px-7 py-4 text-[14px] text-white">{t('Suivre ma commande sur WhatsApp')}</a>
            <a href="#" className="rounded-full border border-ink px-7 py-4 text-[14px]">{t('Retour à l’accueil')}</a>
          </div>
          <p className="mt-8 text-[11px] text-ink/50">{t('Prototype : aucun paiement n’a été débité.')}</p>
        </motion.div>
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
      {errors[k] && <p className="mt-1 text-[11px] text-celio">{t('Champ obligatoire')}</p>}
    </div>
  )

  return (
    <div className="bg-white text-ink">
      <section className="px-gutter pb-6 pt-[clamp(40px,5vw,72px)]">
        <a href="#" className="text-[12px] text-ink/60 hover:text-ink">← {t('Continuer mes achats')}</a>
        <Reveal as="h1" className="mt-4 text-[clamp(40px,5vw,72px)] font-light leading-none">
          {t('Votre')} <span className="accent">{t('commande')}</span>
        </Reveal>
        <p className="mt-3 text-[13px] text-ink/60">{t('Sans compte · Paiement sécurisé [prestataire à confirmer]')}</p>
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
                <motion.div key="addr" className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease }}>
                  <div className="grid grid-cols-2 gap-4 pt-5 max-sm:grid-cols-1">
                    {field('address', 'Adresse de livraison', { autoComplete: 'street-address', wide: true })}
                    {field('commune', 'Commune', { readOnly: true })}
                    {field('notes', 'Indications pour le livreur (facultatif)')}
                  </div>
                  <p className="mt-3 text-[12px] text-ink/60">{t('Livraison hors de Gombe : [à confirmer]. Écrivez au concierge pour une autre commune.')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Step>

          {/* 3. Paiement */}
          <Step n="3" title={t('Paiement')}>
            <Choices options={PAYMENT} value={payment} onChange={setPayment} name="payment" t={t} />
            <AnimatePresence mode="wait" initial={false}>
              {payment === 'mobile' && (
                <motion.div key="mobile" className="grid grid-cols-2 gap-4 pt-5 max-sm:grid-cols-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
                  <div>
                    <label htmlFor="co-operator" className="mb-1.5 block text-[12px]">{t('Opérateur')}</label>
                    <select id="co-operator" value={form.operator} onChange={set('operator')} className="h-12 w-full rounded-lg border border-ink/20 bg-white px-4 text-[14px]">
                      {OPERATORS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  {field('momo', 'Numéro mobile money', { type: 'tel', placeholder: '+243 …' })}
                  <p className="col-span-2 text-[12px] text-ink/60 max-sm:col-span-1">{t('Vous recevrez une demande de validation sur ce numéro. [Opérateurs à confirmer]')}</p>
                </motion.div>
              )}
              {payment === 'carte' && (
                <motion.div key="carte" className="grid grid-cols-2 gap-4 pt-5 max-sm:grid-cols-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
                  {field('card', 'Numéro de carte', { inputMode: 'numeric', autoComplete: 'cc-number', placeholder: '1234 5678 9012 3456', wide: true })}
                  {field('expiry', 'Expiration (MM/AA)', { autoComplete: 'cc-exp', placeholder: 'MM/AA' })}
                  {field('cvc', 'Cryptogramme', { inputMode: 'numeric', autoComplete: 'cc-csc', placeholder: '123' })}
                  {field('cardName', 'Nom sur la carte', { autoComplete: 'cc-name', wide: true })}
                </motion.div>
              )}
              {payment === 'livraison' && (
                <motion.p key="cash" className="pt-5 text-[13px] text-ink/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {delivery === 'livraison' ? t('Vous réglez le livreur à la remise de la commande.') : t('Vous réglez en boutique, au retrait de la commande.')}
                </motion.p>
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
                    {img && <img src={img} alt="" className={`absolute inset-0 m-auto ${product.boxed || product.images ? 'size-full object-cover' : 'size-[80%] object-contain mix-blend-multiply'}`} />}
                    <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-ink text-[10px] text-white">{qty}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="caps block text-[9px] opacity-60">{product.house?.name ?? product.store}</span>
                    <span className="block text-[13px] leading-snug">{t(product.name)}</span>
                  </span>
                  <span className="text-[13px]">{formatPrice((product.price ?? 0) * qty)}</span>
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
            <motion.span key={total} className="text-[32px] font-light" initial={{ opacity: 0.4, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
              {formatPrice(total)}
            </motion.span>
          </p>
          <motion.button type="submit" whileTap={{ scale: 0.98 }} className="h-14 rounded-full bg-ink text-[14px] text-white transition-opacity hover:opacity-90">
            {payment === 'livraison' ? t('Confirmer la commande') : t('Payer {p}', { p: formatPrice(total) })}
          </motion.button>
          {fromCart && <p className="text-center text-[12px] text-ink/60">{t('Pour modifier les quantités, ouvrez le panier.')}</p>}
          <p className="text-center text-[11px] text-ink/50">
            {t('Une question ?')} <a href={whatsappFor(t('Bonjour, j’ai une question sur ma commande kclick.'))} target="_blank" rel="noreferrer" className="underline">{t('Le concierge vous répond sur WhatsApp')}</a> · {contact.email}
          </p>
          <p className="text-center text-[11px] text-ink/50">{t('Prototype : aucun paiement n’est débité.')}</p>
        </aside>
      </form>
    </div>
  )
}

function Step({ n, title, children }) {
  return (
    <motion.fieldset initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: Number(n) * 0.08, ease }}>
      <legend className="mb-5 flex items-center gap-3 text-[22px] font-light">
        <span className="grid size-8 place-items-center rounded-full border border-ink text-[13px]">{n}</span>
        {title}
      </legend>
      {children}
    </motion.fieldset>
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
