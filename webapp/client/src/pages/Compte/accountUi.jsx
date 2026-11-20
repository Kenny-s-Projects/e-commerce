/* eslint-disable react-refresh/only-export-components -- composants et petites fonctions liées, gardés ensemble */
import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'
import { HOUSE_COLORS, HOUSE_NAMES } from '../../data/account.js'

// Éléments communs des écrans « Mon compte » (connexion, inscription, code, profil, suivi)

export const ease = [0.22, 1, 0.36, 1]

/** Apparition douce, utilisée en tête de chaque écran */
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease, delay },
})

/**
 * Mise en page des écrans de connexion :
 * téléphone : une colonne ; ordinateur : panneau éditorial à gauche, formulaire à droite.
 */
export function AuthShell({ children }) {
  const t = useT()
  const perks = ['Vos adresses enregistrées, sans les retaper', 'Le suivi de vos commandes en direct', 'Recommander en un geste']
  return (
    <section className="grid min-h-[calc(100svh-4rem)] bg-white text-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-cream px-[clamp(40px,5vw,88px)] py-[clamp(56px,7vw,104px)] lg:flex lg:flex-col lg:justify-between">
        <m.div {...fadeUp(0.1)}>
          <p className="caps text-[#86671f]">{t('kclick · Mon compte')}</p>
          <p className="mt-8 max-w-[440px] text-[clamp(34px,3.2vw,48px)] font-light leading-[1.1] tracking-[-0.01em]">
            {t('Un compte pour')} <span className="accent">{t('les quatre Maisons.')}</span>
          </p>
          <ul className="mt-10 flex flex-col gap-4 text-[15px] text-ink/75">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span aria-hidden className="size-[7px] bg-gold" />
                {t(p)}
              </li>
            ))}
          </ul>
        </m.div>
        <m.ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink/70" {...fadeUp(0.3)}>
          {Object.keys(HOUSE_NAMES).map((h) => (
            <li key={h} className="flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: HOUSE_COLORS[h] }} />
              {HOUSE_NAMES[h]}
            </li>
          ))}
        </m.ul>
      </aside>
      <div className="flex justify-center px-6 pb-14 pt-[clamp(36px,6vw,96px)] lg:items-center lg:px-[clamp(40px,5vw,88px)]">
        <div className="flex w-full max-w-[440px] flex-col">{children}</div>
      </div>
    </section>
  )
}

/** Champ de formulaire (libellé au-dessus, cadre fin, message d'erreur) */
export function Field({ id, label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-2 text-[12px] text-ink/60">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[12px] text-celio">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClass = (error) =>
  `h-14 w-full min-w-0 border bg-white px-4 text-[16px] outline-none transition-colors placeholder:text-ink/35 focus:border-ink ${error ? 'border-celio' : 'border-[#cfc9bd]'}`

/** Bouton plein noir (capitales espacées), comme la maquette */
export function PrimaryButton({ children, className = '', ...rest }) {
  return (
    <m.button
      whileTap={{ scale: 0.985 }}
      className={`caps h-14 w-full bg-ink text-[12px] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#9b9b9b] ${className}`}
      {...rest}
    >
      {children}
    </m.button>
  )
}

export function OutlineButton({ href, children, className = '' }) {
  return (
    <a href={href} className={`caps grid h-14 w-full place-items-center border border-ink text-[12px] transition-colors hover:bg-ink hover:text-white ${className}`}>
      {children}
    </a>
  )
}

/** Lien souligné discret */
export const underline = 'border-b border-ink pb-0.5 transition-colors hover:border-gold'

/** Pastille de statut d'une commande */
export function StatusPill({ status }) {
  const t = useT()
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full px-3 text-[12px] font-medium" style={{ background: status.bg, color: status.fg }}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {t(status.label)}
    </span>
  )
}

/** Points de couleur + noms des Maisons d'une commande */
export function Houses({ houses, className = '' }) {
  return (
    <span className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      {houses.map((h) => (
        <span key={h} className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: HOUSE_COLORS[h] }} />
          {HOUSE_NAMES[h]}
        </span>
      ))}
    </span>
  )
}

export const readSession = (key) => {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}
export const writeSession = (key, value) => {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* stockage indisponible : on continue sans */
  }
}
export const EMAIL_KEY = 'kclick-login-email'
