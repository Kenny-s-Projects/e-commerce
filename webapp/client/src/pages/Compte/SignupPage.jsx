import { useState } from 'react'
import { m } from 'framer-motion'
import { useLang, useT } from '../../i18n/lang.js'
import { AuthShell, EMAIL_KEY, Field, PrimaryButton, fadeUp, inputClass, underline, writeSession } from './accountUi.jsx'
import { authMessage, requestCode, savePending } from './auth.js'
import { api } from '../../lib/api.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Inscription (#compte/inscription) : l'e-mail est ensuite confirmé avec un code */
export default function SignupPage() {
  const t = useT()
  const { lang, setLang } = useLang()
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', terms: false, news: false })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState('')
  const [existing, setExisting] = useState(false) // un compte existe déjà avec cet e-mail

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((er) => ({ ...er, [k]: undefined }))
    if (k === 'email') setExisting(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (sending) return
    const er = {}
    if (!form.firstName.trim()) er.firstName = t('Indiquez votre prénom.')
    if (!form.lastName.trim()) er.lastName = t('Indiquez votre nom.')
    if (form.phone.replace(/\D/g, '').length < 9) er.phone = t('Numéro incomplet : 9 chiffres après +243.')
    if (!EMAIL_RE.test(form.email.trim())) er.email = t('Saisissez une adresse e-mail valide.')
    if (!form.terms) er.terms = t('Acceptez les conditions pour créer votre compte.')
    setErrors(er)
    const first = Object.keys(er)[0]
    if (first) {
      document.getElementById(`su-${first}`)?.focus()
      return
    }
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`
    const phone = `+243 ${form.phone.replace(/\D/g, '').replace(/^243/, '')}`
    setSending(true)
    setServerError('')
    try {
      // Une adresse ne peut avoir qu'un compte : si elle est déjà utilisée, on propose de se connecter
      const { exists } = await api.post('/auth/email/check', { email: form.email.trim() }, { auth: false })
      if (exists) {
        setExisting(true)
        setErrors((er) => ({ ...er, email: t('Un compte existe déjà avec cet e-mail.') }))
        document.getElementById('su-email')?.focus()
        return
      }
      await requestCode({ email: form.email.trim(), mode: 'signup', fullName, phone })
      writeSession(EMAIL_KEY, form.email.trim())
      savePending({ mode: 'signup', fullName, phone, lang })
      window.location.hash = 'compte/code'
    } catch (err) {
      setServerError(t(authMessage(err)))
    } finally {
      setSending(false)
    }
  }

  const input = (k, props = {}) => (
    <input
      id={`su-${k}`}
      value={form[k]}
      onChange={set(k)}
      aria-invalid={!!errors[k] || undefined}
      aria-describedby={errors[k] ? `su-${k}-error` : undefined}
      className={inputClass(errors[k])}
      {...props}
    />
  )

  return (
    <AuthShell>
      <m.div {...fadeUp()}>
        <a href="#compte" className="mb-6 inline-flex items-center gap-2 text-[13px] text-ink/60 transition-colors hover:text-ink">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {t('Retour')}
        </a>
        <h1 className="text-[clamp(36px,4vw,50px)] font-light leading-[1.05] tracking-[-0.01em]">
          {t('Créer un')} <span className="accent">{t('compte')}</span>
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-ink/70">{t('Un compte pour les quatre Maisons. Vous confirmerez votre e-mail avec un code.')}</p>
      </m.div>

      <m.form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5" {...fadeUp(0.1)}>
        <div className="grid grid-cols-2 gap-3">
          <Field id="su-firstName" label={t('Prénom')} error={errors.firstName}>
            {input('firstName', { autoComplete: 'given-name' })}
          </Field>
          <Field id="su-lastName" label={t('Nom')} error={errors.lastName}>
            {input('lastName', { autoComplete: 'family-name' })}
          </Field>
        </div>

        <Field id="su-phone" label={t('Téléphone (WhatsApp)')} error={errors.phone} hint={t('Le livreur et la conciergerie vous joignent sur ce numéro.')}>
          <div className={`flex h-14 border transition-colors focus-within:border-ink ${errors.phone ? 'border-celio' : 'border-[#cfc9bd]'}`}>
            <span className="grid w-[60px] shrink-0 place-items-center border-r border-[#cfc9bd] bg-[#f2efe8] text-[15px]">+243</span>
            <input
              id="su-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="81 000 0000"
              value={form.phone}
              onChange={set('phone')}
              aria-invalid={!!errors.phone || undefined}
              aria-describedby={errors.phone ? 'su-phone-error' : undefined}
              className="min-w-0 flex-1 bg-white px-4 text-[16px] outline-none placeholder:text-ink/35"
            />
          </div>
        </Field>

        <Field id="su-email" label={t('Adresse e-mail')} error={errors.email}>
          {input('email', { type: 'email', inputMode: 'email', autoComplete: 'email', placeholder: 'vous@exemple.com' })}
        </Field>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium">{t('Langue')}</legend>
          <div className="grid h-12 grid-cols-2 border border-ink">
            {[
              ['fr', 'Français'],
              ['en', 'English'],
            ].map(([l, label]) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`text-[14px] transition-colors ${lang === l ? 'bg-ink text-white' : 'bg-white hover:bg-cream'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 pt-1">
          <div>
            <label className="flex items-start gap-3 text-[14px] leading-[1.55]">
              <input id="su-terms" type="checkbox" checked={form.terms} onChange={set('terms')} className="mt-0.5 size-5 shrink-0 accent-ink" aria-invalid={!!errors.terms || undefined} />
              <span>
                {t('J’accepte les')} <a href="#aide/livraison" className={underline}>{t('conditions de vente')}</a> {t('et la')}{' '}
                <a href="#aide/livraison" className={underline}>{t('politique de confidentialité')}</a>.
              </span>
            </label>
            {errors.terms && <p className="ml-8 mt-1.5 text-[12px] text-celio">{errors.terms}</p>}
          </div>
          <label className="flex items-start gap-3 text-[14px] leading-[1.55] text-ink/70">
            <input type="checkbox" checked={form.news} onChange={set('news')} className="mt-0.5 size-5 shrink-0 accent-ink" />
            {t('Recevoir les nouveautés des Maisons (facultatif).')}
          </label>
        </div>

        {existing && (
          <p className="text-[13px]">
            <a
              href="#compte"
              onClick={() => writeSession(EMAIL_KEY, form.email.trim())}
              className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
            >
              {t('Se connecter avec cet e-mail')}
            </a>
          </p>
        )}
        {serverError && <p role="alert" className="text-[13px] text-celio">{serverError}</p>}
        <PrimaryButton type="submit" className="mt-2" disabled={sending}>
          {sending ? t('Envoi du code…') : t('Créer mon compte')}
        </PrimaryButton>
        <p className="text-center text-[14px] text-ink/70">
          {t('Déjà un compte ?')}{' '}
          <a href="#compte" className={`text-ink ${underline}`}>
            {t('Se connecter')}
          </a>
        </p>
      </m.form>
    </AuthShell>
  )
}
