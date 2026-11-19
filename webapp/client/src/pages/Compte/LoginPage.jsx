import { useState } from 'react'
import { motion } from 'framer-motion'
import { useT } from '../../i18n/lang.js'
import { AuthShell, EMAIL_KEY, Field, OutlineButton, PrimaryButton, fadeUp, inputClass, readSession, underline, writeSession } from './accountUi.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Connexion (#compte) : code à 6 chiffres reçu par e-mail, sans mot de passe */
export default function LoginPage() {
  const t = useT()
  const [email, setEmail] = useState(() => readSession(EMAIL_KEY) ?? '')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('Saisissez une adresse e-mail valide.'))
      return
    }
    writeSession(EMAIL_KEY, email.trim())
    window.location.hash = 'compte/code'
  }

  return (
    <AuthShell>
      <motion.div {...fadeUp()}>
        <p className="caps text-[#86671f]">{t('Mon compte')}</p>
        <h1 className="mt-4 text-[clamp(38px,4vw,52px)] font-light leading-[1.05] tracking-[-0.01em]">
          {t('Bon')} <span className="accent">{t('retour.')}</span>
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-ink/70">{t('Recevez un code à 6 chiffres par e-mail pour vous connecter. Aucun mot de passe à retenir.')}</p>
      </motion.div>

      <motion.form onSubmit={submit} noValidate className="mt-9 flex flex-col gap-6" {...fadeUp(0.1)}>
        <Field id="login-email" label={t('Adresse e-mail')} error={error}>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            placeholder="vous@exemple.com"
            aria-invalid={!!error || undefined}
            aria-describedby={error ? 'login-email-error' : undefined}
            className={inputClass(error)}
          />
        </Field>
        <PrimaryButton type="submit">{t('Recevoir mon code')}</PrimaryButton>
      </motion.form>

      <motion.div className="mt-8 flex flex-col items-center gap-7" {...fadeUp(0.18)}>
        <div className="flex w-full items-center gap-4 text-[12px] text-ink/50" aria-hidden>
          <span className="h-px flex-1 bg-ink/12" />
          {t('ou')}
          <span className="h-px flex-1 bg-ink/12" />
        </div>
        <OutlineButton href="#compte/inscription">{t('Créer un compte')}</OutlineButton>
        <a href="#checkout" className={`text-[14px] ${underline}`}>
          {t('Commander sans compte')}
        </a>
      </motion.div>

      <motion.p className="mt-14 flex items-start gap-3 text-[13px] leading-[1.6] text-ink/65" {...fadeUp(0.26)}>
        <svg viewBox="0 0 24 24" className="mt-0.5 size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M12 3 5 6v5.5c0 4.2 3 7.8 7 9.5 4-1.7 7-5.3 7-9.5V6l-7-3Z" />
        </svg>
        {t('Avec un compte, vos adresses sont enregistrées et vous suivez vos commandes en direct.')}
      </motion.p>
    </AuthShell>
  )
}
