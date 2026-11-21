import { useState } from 'react'
import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'
import { whatsappFor } from '../../data/products.js'
import { rememberOrder } from '../../lib/orderMemory.js'
import { ease, underline } from '../Compte/accountUi.jsx'

/**
 * « Suivre ma commande » (#suivi) : pour un visiteur sans compte, ou depuis un autre appareil.
 * Numéro de commande + téléphone utilisé à la commande → ouvre le suivi (#suivi/KC-00012).
 */

// « KC-00012 », « kc00012 », « 12 » → « KC-00012 » (format des numéros de l'API : KC- suivi de 5 chiffres au moins)
function normalizeNumber(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits || digits.length > 9) return null
  return `KC-${digits.padStart(5, '0')}`
}

export default function TrackOrderPage() {
  const t = useT()
  const [number, setNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const n = normalizeNumber(number)
    const p = phone.replace(/[^\d+ ]/g, '').trim()
    const errs = {}
    if (!n) errs.number = t('Saisissez le numéro de commande, par exemple KC-00012.')
    if (p.replace(/\D/g, '').length < 9) errs.phone = t('Saisissez le téléphone utilisé lors de la commande.')
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      document.getElementById(`track-${first}`)?.focus()
      return
    }
    rememberOrder(n, p)
    window.location.hash = `suivi/${n}`
  }

  const input = (k, props) => (
    <>
      <input
        id={`track-${k}`}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `track-${k}-error` : undefined}
        className={`mt-2 h-12 w-full border bg-white px-4 text-[15px] outline-none focus:border-ink ${errors[k] ? 'border-celio' : 'border-ink/25'}`}
        {...props}
      />
      {errors[k] && (
        <p id={`track-${k}-error`} className="mt-1 text-[12px] text-celio">
          {errors[k]}
        </p>
      )}
    </>
  )

  return (
    <section className="grid min-h-[calc(100svh-4rem)] place-items-center bg-white px-gutter py-20 text-ink">
      <m.form className="w-full max-w-[440px]" noValidate onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
        <p className="caps text-[#86671f]">{t('Suivi de commande')}</p>
        <h1 className="mt-4 text-[clamp(32px,4vw,46px)] font-light leading-tight">
          {t('Suivre ma')} <span className="accent">{t('commande')}</span>
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-ink/70">
          {t('Pas besoin de compte : saisissez le numéro reçu après votre commande et le téléphone utilisé.')}
        </p>

        <label htmlFor="track-number" className="mt-8 block text-[13px]">{t('Numéro de commande')}</label>
        {input('number', {
          type: 'text',
          autoComplete: 'off',
          autoCapitalize: 'characters',
          placeholder: 'KC-00012',
          value: number,
          onChange: (e) => {
            setNumber(e.target.value)
            setErrors((er) => ({ ...er, number: undefined }))
          },
        })}

        <label htmlFor="track-phone" className="mt-5 block text-[13px]">{t('Téléphone')}</label>
        {input('phone', {
          type: 'tel',
          autoComplete: 'tel',
          inputMode: 'tel',
          placeholder: '+243 …',
          value: phone,
          onChange: (e) => {
            setPhone(e.target.value)
            setErrors((er) => ({ ...er, phone: undefined }))
          },
        })}

        <button type="submit" className="caps mt-6 h-14 w-full bg-ink text-[11px] text-white">{t('Voir ma commande')}</button>
        <a href={whatsappFor(t('Bonjour, je souhaite suivre ma commande kclick.'))} target="_blank" rel="noreferrer" className={`mt-6 inline-block text-[14px] ${underline}`}>
          {t('Écrire à la conciergerie')}
        </a>
      </m.form>
    </section>
  )
}
