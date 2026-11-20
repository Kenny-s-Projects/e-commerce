import { useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'
import { AuthShell, EMAIL_KEY, PrimaryButton, fadeUp, readSession, underline } from './accountUi.jsx'
import { authMessage, confirmCode, readPending, requestCode } from './auth.js'

const LENGTH = 6
const RESEND_DELAY = 30

/** Code reçu par e-mail (#compte/code) : 6 cases, renvoi après 30 s, vérification par Supabase Auth */
export default function CodePage() {
  const t = useT()
  const email = readSession(EMAIL_KEY) || ''
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  // Sans e-mail (page ouverte directement) : retour à la connexion
  useEffect(() => {
    if (!email) window.location.hash = 'compte'
  }, [email])
  const [digits, setDigits] = useState(() => Array(LENGTH).fill(''))
  const [wait, setWait] = useState(RESEND_DELAY)
  const [sent, setSent] = useState(false)
  const inputs = useRef([])

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const complete = digits.every((d) => d !== '')

  const fill = (from, text) => {
    const chars = text.replace(/\D/g, '').slice(0, LENGTH - from).split('')
    if (!chars.length) return
    setDigits((d) => {
      const next = [...d]
      chars.forEach((c, i) => (next[from + i] = c))
      return next
    })
    inputs.current[Math.min(from + chars.length, LENGTH - 1)]?.focus()
  }

  const onChange = (i) => (e) => {
    const v = e.target.value.replace(/\D/g, '')
    if (v.length > 1) return fill(i, v)
    setDigits((d) => d.map((x, j) => (j === i ? v : x)))
    if (v && i < LENGTH - 1) inputs.current[i + 1]?.focus()
  }

  const onKeyDown = (i) => (e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      setDigits((d) => d.map((x, j) => (j === i - 1 ? '' : x)))
      inputs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus()
  }

  const onPaste = (i) => (e) => {
    e.preventDefault()
    fill(i, e.clipboardData.getData('text'))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!complete || checking) return
    setChecking(true)
    setError('')
    try {
      window.location.hash = (await confirmCode(email, digits.join(''))).replace(/^#/, '')
    } catch (err) {
      setError(t(authMessage(err)))
      setDigits(Array(LENGTH).fill(''))
      inputs.current[0]?.focus()
    } finally {
      setChecking(false)
    }
  }

  const resend = async () => {
    setError('')
    try {
      const pending = readPending() ?? { mode: 'login' }
      await requestCode({ email, mode: pending.mode, fullName: pending.fullName, phone: pending.phone })
      setSent(true)
    } catch (err) {
      setError(t(authMessage(err)))
    }
    setWait(RESEND_DELAY)
    setDigits(Array(LENGTH).fill(''))
    inputs.current[0]?.focus()
  }

  return (
    <AuthShell>
      <m.div {...fadeUp()}>
        <span className="grid size-14 place-items-center rounded-full bg-[#f2efe8]" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3.5" y="6" width="17" height="12" rx="1" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        <h1 className="mt-7 text-[clamp(36px,4vw,50px)] font-light leading-[1.05] tracking-[-0.01em]">
          {t('Vérifiez vos')} <span className="accent">{t('e-mails.')}</span>
        </h1>
        <p className="mt-4 text-[15px] leading-[1.7] text-ink/70">
          {t('Nous avons envoyé un code à 6 chiffres à')} <strong className="break-all font-medium text-ink">{email}</strong>. {t('Il est valable 10 minutes.')}
        </p>
      </m.div>

      <m.form onSubmit={submit} className="mt-8 flex flex-col gap-6" {...fadeUp(0.1)}>
        <fieldset>
          <legend className="mb-3 text-[13px] font-medium">{t('Code de connexion')}</legend>
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                value={d}
                onChange={onChange(i)}
                onKeyDown={onKeyDown(i)}
                onPaste={onPaste(i)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={LENGTH}
                autoFocus={i === 0}
                aria-label={t('Chiffre {n} sur 6', { n: i + 1 })}
                className="aspect-[5/6] w-full min-w-0 border border-[#cfc9bd] bg-white text-center font-mono text-[24px] outline-none transition-colors focus:border-ink"
              />
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-[13px] text-celio">{error}</p>}
        <PrimaryButton type="submit" disabled={!complete || checking}>
          {checking ? t('Vérification…') : t('Valider')}
        </PrimaryButton>
      </m.form>

      <m.div className="mt-6 flex flex-col items-center gap-5 text-[14px]" {...fadeUp(0.16)}>
        <p className="text-ink/70" aria-live="polite">
          {wait > 0 ? (
            <>
              {sent ? `${t('Nouveau code envoyé.')} ` : ''}
              {t('Renvoyer le code dans')} <span className="font-mono">0:{String(wait).padStart(2, '0')}</span>
            </>
          ) : (
            <button type="button" onClick={resend} className={`text-ink ${underline}`}>
              {t('Renvoyer le code')}
            </button>
          )}
        </p>
        <a href="#compte" className={underline}>
          {t('Modifier l’adresse e-mail')}
        </a>
      </m.div>

      <m.p className="mt-14 text-[13px] leading-[1.6] text-ink/65" {...fadeUp(0.24)}>
        {t('Rien reçu ? Regardez dans les courriers indésirables, ou écrivez à la conciergerie sur WhatsApp.')}
      </m.p>
    </AuthShell>
  )
}
