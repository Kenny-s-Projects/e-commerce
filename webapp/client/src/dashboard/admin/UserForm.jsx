import { useState } from 'react'
import { api } from '../../lib/api.js'
import { BRANDS, ROLES } from '../data/demo.js'
import { useStore } from '../store/store.jsx'
import { Button, Card, PageTitle } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { getLang, tr } from '../lib/i18n.js'
import { dateLocale } from '../lib/format.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ROLE_ICONS = { super_admin: 'settings', employe: 'store', livreur: 'bike' }
// Adresse de l'espace équipe : à remplacer par le vrai domaine du site une fois en ligne
const LOGIN_URL = typeof window !== 'undefined' ? `${window.location.host}/#connexion` : '#connexion'

const empty = { firstName: '', lastName: '', email: '', phone: '', role: 'employe', brand: '', vehicle: 'Moto', zone: 'Gombe' }

function validate(form, users, id) {
  const errors = {}
  if (!form.firstName.trim()) errors.firstName = tr('Prénom obligatoire')
  if (!form.lastName.trim()) errors.lastName = tr('Nom obligatoire')
  const email = form.email.trim().toLowerCase()
  if (!email) errors.email = tr('E-mail obligatoire')
  else if (!EMAIL.test(email)) errors.email = tr('E-mail invalide')
  else if (users.some((u) => u.id !== id && u.email.toLowerCase() === email)) errors.email = tr('Cette adresse est déjà utilisée par un autre compte')
  const digits = form.phone.replace(/\D/g, '')
  if (digits && digits.length < 9) errors.phone = tr('Numéro incomplet')
  if (form.role === 'employe' && !BRANDS[form.brand]) errors.brand = tr('Choisissez la Maison de cet employé')
  if (form.role === 'livreur' && !form.zone.trim()) errors.zone = tr('Zone obligatoire')
  return errors
}

/** Numéro saisi sans indicatif → « +243 … » */
const withPrefix = (phone) => {
  const p = phone.trim()
  if (!p) return ''
  return p.startsWith('+') ? p : `+243 ${p.replace(/^0/, '')}`
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px]">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-d-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-d-muted">{hint}</p>
      )}
    </div>
  )
}

const inputClass = (error) =>
  `h-11 w-full min-w-0 rounded-[10px] border bg-white px-3.5 text-sm outline-none transition-colors focus:border-d-ink ${error ? 'border-d-danger' : 'border-d-line'}`

/** Aperçu de l'e-mail d'invitation (l'e-mail part toujours en français : son texte n'est pas traduit) */
function InvitePreview({ form }) {
  const role = ROLES[form.role].label.toLowerCase()
  const scope =
    form.role === 'employe' && BRANDS[form.brand]
      ? ` pour la Maison ${BRANDS[form.brand].name}`
      : form.role === 'livreur'
        ? ` (zone ${form.zone || 'Gombe'})`
        : ''
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-medium">{tr('Message d’invitation')}</h2>
      <p className="mt-1 text-xs text-d-muted">
        {tr('Envoyé à')} <span className="font-mono">{form.email.trim() || tr('adresse e-mail')}</span>
        {getLang() === 'en' && <> · E-mail sent in French</>}
      </p>
      <div lang="fr" className="mt-4 rounded-[10px] bg-d-soft/70 p-4 text-[13.5px] leading-relaxed">
        <p className="font-medium">Objet : votre accès à kclick</p>
        <p className="mt-3">Bonjour {form.firstName.trim() || '…'},</p>
        <p className="mt-2">
          Vous avez été ajouté(e) à kclick en tant que <strong className="font-medium">{role}</strong>
          {scope}.
        </p>
        <p className="mt-2">
          Pour vous connecter, ouvrez <span className="font-mono text-[12.5px]">{LOGIN_URL}</span> et saisissez cette adresse e-mail : vous recevrez un code à 6 chiffres, sans mot de passe.
        </p>
        <p className="mt-2 text-d-muted">L’équipe kclick</p>
      </div>
    </Card>
  )
}

/** Ajouter (id = null) ou modifier un utilisateur de l'équipe (attend le chargement de la liste en modification) */
export default function UserForm({ id }) {
  const { loading } = useStore()
  if (id && loading) return <Card className="mx-auto mt-6 max-w-lg p-8 text-center text-sm text-d-muted">{tr('Chargement…')}</Card>
  return <UserFormInner key={id ?? 'nouveau'} id={id} />
}

function UserFormInner({ id }) {
  const { users, dispatch } = useStore()
  const existing = id ? users.find((u) => u.id === id) : null
  const [form, setForm] = useState(() => (existing ? { ...empty, ...existing, brand: existing.brand ?? '', vehicle: existing.vehicle ?? 'Moto', zone: existing.zone ?? 'Gombe', phone: existing.phone ?? '' } : empty))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [done, setDone] = useState(null) // 'invite' | 'saved'
  const [confirmStatus, setConfirmStatus] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  if (id && !existing) {
    return (
      <Card className="mx-auto mt-6 max-w-lg p-8 text-center">
        <p className="text-[17px]">{tr('Utilisateur introuvable.')}</p>
        <p className="mt-2 text-sm text-d-muted">{tr('Ce compte n’existe pas ou a été supprimé.')}</p>
        <a href="#admin/utilisateurs" className="mt-5 inline-block text-[13px] underline decoration-d-border underline-offset-4">
          {tr('Retour à la liste')}
        </a>
      </Card>
    )
  }

  const set = (key) => (e) => {
    const next = { ...form, [key]: e.target.value }
    setForm(next)
    if (submitted) setErrors(validate(next, users, id))
  }
  const setRole = (role) => {
    const next = { ...form, role }
    setForm(next)
    if (submitted) setErrors(validate(next, users, id))
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSubmitted(true)
    const errs = validate(form, users, id)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus()
      return
    }
    const user = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: withPrefix(form.phone),
      role: form.role,
      brand: form.role === 'employe' ? form.brand : undefined,
      vehicle: form.role === 'livreur' ? form.vehicle.trim() || 'Moto' : undefined,
      zone: form.role === 'livreur' ? form.zone.trim() : undefined,
    }
    setSaving(true)
    const changes = { ...user }
    delete changes.email // l'e-mail d'un compte existant ne se modifie pas ici
    const res = existing ? await dispatch({ type: 'user/update', id, changes }) : await dispatch({ type: 'user/invite', user })
    setSaving(false)
    if (res?.error) {
      setServerError(tr(res.error.message))
      return
    }
    setDone(existing ? 'saved' : 'invite')
    window.scrollTo({ top: 0 })
  }

  const name = existing ? `${existing.firstName} ${existing.lastName}` : tr('Nouvel utilisateur')

  // Invitation envoyée
  if (done === 'invite') {
    return (
      <>
        <Breadcrumb name={tr('Nouvel utilisateur')} />
        <Card className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#e1eee2] text-[#2f5a37]">
            <Icon name="check" className="size-6" />
          </span>
          <h1 className="text-[26px] font-light">
            {tr('Invitation')} <span className="font-serif italic">{tr('envoyée.')}</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-d-muted">
            {tr('{name} peut se connecter à l’espace équipe avec', { name: form.firstName.trim() })} <span className="font-mono text-d-ink">{form.email.trim().toLowerCase()}</span>{' '}
            {tr(': un code lui sera envoyé par e-mail et son rôle s’activera à la première connexion. L’e-mail d’invitation partira automatiquement dès que le service d’e-mails sera branché ; en attendant, prévenez-la vous-même.')}
          </p>
          <div className="mt-4 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
            <Button
              onClick={() => {
                setForm(empty)
                setErrors({})
                setSubmitted(false)
                setDone(null)
              }}
            >
              {tr('Ajouter une autre personne')}
            </Button>
            <Button variant="outline" onClick={() => (window.location.hash = 'admin/utilisateurs')}>
              {tr('Retour à la liste')}
            </Button>
          </div>
        </Card>
      </>
    )
  }

  const status = existing?.status

  return (
    <>
      <Breadcrumb name={name} />
      <header className="mb-7 mt-3">
        {existing ? (
          <PageTitle before={`${existing.firstName} `} accent={existing.lastName} />
        ) : (
          <PageTitle before={tr('Ajouter un ')} accent={tr('utilisateur')} />
        )}
        <p className="mt-2 max-w-xl text-sm text-d-muted">
          {existing
            ? tr('Modifiez les informations ou le rôle de ce compte.')
            : tr('La personne reçoit une invitation par e-mail et se connecte ensuite avec un code, sans mot de passe.')}
        </p>
      </header>

      {done === 'saved' && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-[10px] bg-[#e1eee2] px-4 py-3 text-sm text-[#2f5a37]">
          <Icon name="check" className="size-4" />
          {tr('Modifications enregistrées.')}
        </p>
      )}

      <form onSubmit={submit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-[17px] font-medium">{tr('Identité')}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="firstName" label={tr('Prénom')} error={errors.firstName}>
                <input id="firstName" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'firstName-error' : undefined} className={inputClass(errors.firstName)} />
              </Field>
              <Field id="lastName" label={tr('Nom')} error={errors.lastName}>
                <input id="lastName" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'lastName-error' : undefined} className={inputClass(errors.lastName)} />
              </Field>
              <Field id="email" label={tr('E-mail professionnel')} error={errors.email} hint={tr('Le code de connexion est envoyé à cette adresse.')}>
                <input id="email" type="email" value={form.email} onChange={set('email')} readOnly={!!existing} autoComplete="email" inputMode="email" placeholder="prenom@exemple.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} className={inputClass(errors.email)} />
              </Field>
              <Field id="phone" label={tr('Téléphone (WhatsApp)')} error={errors.phone} hint={tr('Facultatif.')}>
                <span className={`flex h-11 items-center rounded-[10px] border bg-white focus-within:border-d-ink ${errors.phone ? 'border-d-danger' : 'border-d-line'}`}>
                  <span className="border-r border-d-line px-3 font-mono text-[13px] text-d-muted">+243</span>
                  <input id="phone" type="tel" value={form.phone.replace(/^\+243\s?/, '')} onChange={set('phone')} autoComplete="tel-national" inputMode="tel" placeholder="81 000 00 00" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none" />
                </span>
              </Field>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <fieldset>
              <legend className="text-[17px] font-medium">{tr('Rôle')}</legend>
              <div role="radiogroup" aria-label={tr('Rôle')} className="mt-5 grid gap-3 md:grid-cols-3">
                {Object.entries(ROLES).map(([key, r]) => {
                  const active = form.role === key
                  return (
                    <label
                      key={key}
                      className={`relative flex cursor-pointer flex-col gap-2 rounded-[12px] border p-4 transition-colors ${active ? 'border-d-ink bg-[#faf9f6] shadow-[inset_0_0_0_1px_#141414]' : 'border-d-line bg-white hover:border-d-border'}`}
                    >
                      <input type="radio" name="role" value={key} checked={active} onChange={() => setRole(key)} className="sr-only" />
                      <span className="flex items-center justify-between">
                        <span className="grid size-9 place-items-center rounded-full bg-d-soft">
                          <Icon name={ROLE_ICONS[key]} className="size-[17px]" />
                        </span>
                        <span className={`grid size-5 place-items-center rounded-full border ${active ? 'border-d-ink bg-d-ink text-white' : 'border-d-border'}`} aria-hidden>
                          {active && <Icon name="check" className="size-3" strokeWidth={2.2} />}
                        </span>
                      </span>
                      <span className="text-[15px]">{tr(r.label)}</span>
                      <span className="text-[12.5px] leading-relaxed text-d-muted">{tr(r.text)}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {form.role === 'employe' && (
              <div className="mt-5 max-w-sm">
                <Field id="brand" label={tr('Maison')} error={errors.brand}>
                  <select id="brand" value={form.brand} onChange={set('brand')} aria-invalid={!!errors.brand} aria-describedby={errors.brand ? 'brand-error' : undefined} className={inputClass(errors.brand)}>
                    <option value="">{tr('Choisir une Maison…')}</option>
                    {Object.values(BRANDS).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            {form.role === 'livreur' && (
              <div className="mt-5 grid max-w-xl gap-4 sm:grid-cols-2">
                <Field id="vehicle" label={tr('Véhicule')}>
                  <input id="vehicle" value={form.vehicle} onChange={set('vehicle')} className={inputClass(false)} />
                </Field>
                <Field id="zone" label={tr('Zone')} error={errors.zone}>
                  <input id="zone" value={form.zone} onChange={set('zone')} aria-invalid={!!errors.zone} aria-describedby={errors.zone ? 'zone-error' : undefined} className={inputClass(errors.zone)} />
                </Field>
              </div>
            )}
            {form.role === 'super_admin' && (
              <p className="mt-5 rounded-[10px] bg-[#fbefd5] px-4 py-3 text-[13px] text-[#7a5200]">
                {tr('Un super admin peut tout voir et tout modifier, y compris les autres comptes. Réservez ce rôle à la direction.')}
              </p>
            )}
          </Card>

          {serverError && (
            <p role="alert" className="rounded-[10px] bg-[#f7deda] px-4 py-3 text-sm text-[#8e2118]">
              {serverError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button variant="soft" onClick={() => (window.location.hash = 'admin/utilisateurs')}>
              {tr('Annuler')}
            </Button>
            <Button type="submit" disabled={saving}>{saving ? tr('Enregistrement…') : existing ? tr('Enregistrer') : tr('Envoyer l’invitation')}</Button>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          {!existing && <InvitePreview form={form} />}

          {existing && (
            <Card className="p-5">
              <h2 className="text-[15px] font-medium">{tr('Compte')}</h2>
              <dl className="mt-4 grid gap-2.5 text-[13.5px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-d-muted">{tr('Statut')}</dt>
                  <dd>{status === 'actif' ? tr('Actif') : status === 'invite' ? tr('Invitation envoyée') : tr('Désactivé')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-d-muted">{tr('Créé le')}</dt>
                  <dd>{new Date(existing.createdAt).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-d-muted">{tr('Connexion')}</dt>
                  <dd>{tr('Code par e-mail')}</dd>
                </div>
              </dl>
            </Card>
          )}

          {existing?.kind === 'invitation' && (
            <Card className="border-[#e7c9c3] p-5">
              <h2 className="text-[15px] font-medium text-d-danger">{tr('Invitation')}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-d-muted">{tr('Cette personne ne s’est pas encore connectée. Retirer l’invitation l’empêche d’entrer dans l’espace équipe.')}</p>
              <Button
                variant="danger"
                size="sm"
                className="mt-4"
                onClick={async () => {
                  try {
                    await api.del(`/users/invitations/${id}`)
                    window.location.hash = 'admin/utilisateurs'
                  } catch (err) {
                    setServerError(tr(err.message))
                  }
                }}
              >
                {tr('Retirer l’invitation')}
              </Button>
            </Card>
          )}

          {existing && existing.kind !== 'invitation' && (
            <Card className="border-[#e7c9c3] p-5">
              <h2 className="text-[15px] font-medium text-d-danger">{tr('Zone sensible')}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-d-muted">
                {status === 'desactive'
                  ? tr('Ce compte est désactivé : la personne ne peut plus se connecter.')
                  : tr('Désactiver un compte empêche la personne de se connecter. Son historique est conservé.')}
              </p>
              {confirmStatus ? (
                <div className="mt-4 flex flex-col gap-2.5">
                  <p className="text-[13px]">
                    {tr(status === 'desactive' ? 'Réactiver le compte de {name} ?' : 'Désactiver le compte de {name} ?', { name: existing.firstName })}
                  </p>
                  <div className="flex gap-2.5">
                    <Button
                      variant={status === 'desactive' ? 'solid' : 'danger'}
                      size="sm"
                      onClick={() => {
                        dispatch({ type: 'user/update', id, changes: { status: status === 'desactive' ? 'actif' : 'desactive' } })
                        setConfirmStatus(false)
                      }}
                    >
                      {tr('Confirmer')}
                    </Button>
                    <Button variant="soft" size="sm" onClick={() => setConfirmStatus(false)}>
                      {tr('Annuler')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant={status === 'desactive' ? 'outline' : 'danger'} size="sm" className="mt-4" onClick={() => setConfirmStatus(true)}>
                  {status === 'desactive' ? tr('Réactiver le compte') : tr('Désactiver le compte')}
                </Button>
              )}
            </Card>
          )}
        </div>
      </form>
    </>
  )
}

function Breadcrumb({ name }) {
  return (
    <nav aria-label={tr('Fil d’Ariane')} className="text-[13px] text-d-muted">
      <a href="#admin/utilisateurs" className="underline decoration-d-border underline-offset-4 hover:text-d-ink">
        {tr('Utilisateurs')}
      </a>
      <span className="mx-1.5">/</span>
      <span className="text-d-ink">{name}</span>
    </nav>
  )
}
