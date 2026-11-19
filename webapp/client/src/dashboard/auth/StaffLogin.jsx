import { useEffect, useRef, useState } from 'react'
import { BRANDS } from '../data/demo.js'
import { useStore } from '../store/store.jsx'

/*
 * Connexion de l'équipe (super admin, employés, livreurs) : e-mail, puis code à 6 chiffres reçu par e-mail.
 * Démonstration : n'importe quel code à 6 chiffres est accepté ; le compte est cherché dans les utilisateurs du store.
 */

const KEY = 'kclick-staff-email'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RESEND_DELAY = 30

const readEmail = () => {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}
const saveEmail = (email) => {
  try {
    sessionStorage.setItem(KEY, email)
  } catch {
    /* navigation privée : on garde l'e-mail en mémoire seulement */
  }
}

const homeOf = (user) => (user.role === 'super_admin' ? 'admin' : user.role === 'employe' ? `employe/${user.brand}` : 'livreur')

function Logo({ className = '' }) {
  return (
    <span className={`flex items-baseline gap-3 ${className}`}>
      <span className="text-[22px] tracking-[-0.01em]">kclick</span>
      <span className="caps text-[9.5px] text-d-gold">Dashboard</span>
    </span>
  )
}

const Dots = () => (
  <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/75">
    {Object.values(BRANDS).map((b) => (
      <li key={b.id} className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: b.id === 'adidas' ? '#f6f4ef' : b.color }} aria-hidden />
        {b.name}
      </li>
    ))}
  </ul>
)

/** Page de connexion : panneau noir à gauche (ordinateur) ou en haut (téléphone), formulaire à droite */
export default function StaffLogin({ step }) {
  const { users } = useStore()
  const [email, setEmail] = useState(readEmail)
  const known = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  const showCode = step === 'code' && known && known.status !== 'desactive'

  // Arriver sur l'étape code sans e-mail valide : retour à l'étape e-mail
  useEffect(() => {
    if (step === 'code' && !showCode) window.location.hash = 'connexion'
  }, [step, showCode])

  return (
    <div className="flex min-h-svh flex-col bg-d-bg font-sans text-d-ink antialiased lg:flex-row">
      {/* Panneau de marque */}
      <aside className="relative flex flex-col justify-between gap-8 overflow-hidden bg-d-ink px-[clamp(20px,5vw,64px)] py-7 text-white lg:min-h-svh lg:w-[46%] lg:py-12">
        <a href="#connexion" aria-label="kclick dashboard, connexion">
          <Logo />
        </a>
        <div className="max-lg:hidden">
          <p className="caps text-d-gold">Kenny’s International</p>
          <h1 className="mt-4 text-[clamp(40px,4.6vw,64px)] font-light leading-[1.05] tracking-[-0.015em]">
            L’espace <span className="font-serif italic">équipe</span>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">
            Commandes, préparation en boutique et livraisons à Gombe : chacun retrouve ici ce qui le concerne, selon son rôle.
          </p>
        </div>
        <div className="max-lg:hidden">
          <Dots />
        </div>
        {/* Bande décorative : les couleurs des quatre Maisons */}
        <span className="absolute inset-x-0 bottom-0 flex h-1" aria-hidden>
          {Object.values(BRANDS).map((b) => (
            <span key={b.id} className="flex-1" style={{ background: b.id === 'adidas' ? '#5e5b55' : b.color }} />
          ))}
        </span>
      </aside>

      {/* Formulaire */}
      <main className="flex flex-1 items-start justify-center px-[clamp(20px,5vw,64px)] pb-12 pt-10 lg:items-center lg:py-12">
        <div className="w-full max-w-[420px]">
          {showCode ? <CodeStep user={known} /> : <EmailStep email={email} setEmail={setEmail} users={users} />}
          <a href="#" className="mt-10 inline-block text-[13px] text-d-muted underline decoration-d-border underline-offset-4 hover:text-d-ink">
            Retour au site
          </a>
        </div>
      </main>
    </div>
  )
}

function EmailStep({ email, setEmail, users }) {
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const submit = (e) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!EMAIL.test(value)) {
      setError('Saisissez une adresse e-mail valide.')
      inputRef.current?.focus()
      return
    }
    const user = users.find((u) => u.email.toLowerCase() === value)
    if (!user) {
      setError('Aucun compte d’équipe avec cette adresse. Demandez une invitation à l’administrateur.')
      inputRef.current?.focus()
      return
    }
    if (user.status === 'desactive') {
      setError('Ce compte est désactivé. Contactez l’administrateur.')
      return
    }
    setEmail(value)
    saveEmail(value)
    window.location.hash = 'connexion/code'
  }

  const demo = [
    users.find((u) => u.role === 'super_admin' && u.status !== 'desactive'),
    users.find((u) => u.role === 'employe' && u.status !== 'desactive'),
    users.find((u) => u.role === 'livreur' && u.status !== 'desactive'),
  ].filter(Boolean)

  return (
    <>
      <p className="caps text-d-gold-ink">Connexion</p>
      <h2 className="mt-3 text-[clamp(32px,3.6vw,42px)] font-light leading-[1.1]">
        Bon <span className="font-serif italic">retour.</span>
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-d-muted">Pas de mot de passe : un code à 6 chiffres vous est envoyé par e-mail.</p>

      <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="staff-email" className="text-[13px]">
            Adresse e-mail professionnelle
          </label>
          <input
            ref={inputRef}
            id="staff-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            placeholder="prenom@exemple.com"
            aria-invalid={!!error}
            aria-describedby={error ? 'staff-email-error' : undefined}
            className={`h-12 w-full rounded-[10px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-d-ink ${error ? 'border-d-danger' : 'border-d-line'}`}
          />
          {error && (
            <p id="staff-email-error" role="alert" className="text-[13px] leading-relaxed text-d-danger">
              {error}
            </p>
          )}
        </div>
        <button type="submit" className="h-12 rounded-lg bg-d-ink text-[15px] text-white transition-colors hover:bg-black">
          Recevoir mon code
        </button>
      </form>

      <div className="mt-10 rounded-[12px] border border-dashed border-d-border p-4">
        <p className="text-xs text-d-muted">Démonstration : cliquez sur une adresse pour la saisir.</p>
        <ul className="mt-3 flex flex-col gap-2">
          {demo.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => {
                  setEmail(u.email)
                  setError('')
                  inputRef.current?.focus()
                }}
                className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-left text-[13px] hover:text-d-ink"
              >
                <span className="min-w-0 break-all font-mono text-[12.5px] underline decoration-d-border underline-offset-4">{u.email}</span>
                <span className="text-xs text-d-muted">
                  {u.role === 'super_admin' ? 'Super admin' : u.role === 'employe' ? `Employé · ${BRANDS[u.brand].name}` : 'Livreur'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function CodeStep({ user }) {
  const { dispatch } = useStore()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [wait, setWait] = useState(RESEND_DELAY)
  const [resent, setResent] = useState(false)
  const refs = useRef([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])
  useEffect(() => {
    if (wait <= 0) return undefined
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const code = digits.join('')
  const complete = /^\d{6}$/.test(code)

  const fill = (start, value) => {
    const chars = value.replace(/\D/g, '').slice(0, 6 - start).split('')
    if (!chars.length) return
    const next = [...digits]
    chars.forEach((c, i) => (next[start + i] = c))
    setDigits(next)
    setError('')
    refs.current[Math.min(start + chars.length, 5)]?.focus()
  }

  const onKeyDown = (i) => (e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      const next = [...digits]
      next[i - 1] = ''
      setDigits(next)
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
  }

  const submit = (e) => {
    e.preventDefault()
    if (!complete) {
      setError('Saisissez les 6 chiffres du code.')
      return
    }
    dispatch({ type: 'user/update', id: user.id, changes: { status: 'actif', lastSeenAt: new Date().toISOString() } })
    window.location.hash = homeOf(user)
  }

  return (
    <>
      <p className="caps text-d-gold-ink">Connexion</p>
      <h2 className="mt-3 text-[clamp(32px,3.6vw,42px)] font-light leading-[1.1]">
        Vérifiez vos <span className="font-serif italic">e-mails.</span>
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-d-muted">
        Nous avons envoyé un code à 6 chiffres à <span className="break-all font-mono text-[14px] text-d-ink">{user.email}</span>. Il est valable 10 minutes.
      </p>

      <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-[13px]">Code de connexion</legend>
          <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={6}
                value={d}
                aria-label={`Chiffre ${i + 1} sur 6`}
                aria-invalid={!!error}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '')
                  if (!v) {
                    const next = [...digits]
                    next[i] = ''
                    setDigits(next)
                    return
                  }
                  fill(i, v.length > 1 && d ? v.replace(d, '') || v : v)
                }}
                onPaste={(e) => {
                  e.preventDefault()
                  fill(0, e.clipboardData.getData('text'))
                }}
                onKeyDown={onKeyDown(i)}
                onFocus={(e) => e.target.select()}
                className={`aspect-[4/5] w-full min-w-0 rounded-[10px] border bg-white text-center font-mono text-[22px] outline-none transition-colors focus:border-d-ink ${error ? 'border-d-danger' : 'border-d-line'}`}
              />
            ))}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-d-danger">
              {error}
            </p>
          )}
        </fieldset>

        <button type="submit" disabled={!complete} className="h-12 rounded-lg bg-d-ink text-[15px] text-white transition-colors hover:bg-black disabled:opacity-40">
          Valider
        </button>
      </form>

      <div className="mt-6 flex flex-col items-start gap-3 text-[13px]">
        {wait > 0 ? (
          <p className="text-d-muted">
            Renvoyer le code dans <span className="font-mono">0:{String(wait).padStart(2, '0')}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setWait(RESEND_DELAY)
              setResent(true)
            }}
            className="underline decoration-d-border underline-offset-4 hover:decoration-d-ink"
          >
            Renvoyer le code
          </button>
        )}
        {resent && wait > 0 && (
          <p role="status" className="text-[#2f5a37]">
            Un nouveau code vient d’être envoyé.
          </p>
        )}
        <a href="#connexion" className="underline decoration-d-border underline-offset-4 hover:decoration-d-ink">
          Modifier l’adresse e-mail
        </a>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-d-muted">
        Rien reçu ? Regardez dans les courriers indésirables. Démonstration : n’importe quel code à 6 chiffres est accepté.
      </p>
    </>
  )
}
