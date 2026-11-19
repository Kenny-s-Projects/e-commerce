import { useEffect, useMemo, useState } from 'react'
import { BRANDS, ROLES } from '../data/demo.js'
import { useStore } from '../store/store.jsx'
import { api } from '../../lib/api.js'
import { ago } from '../lib/format.js'
import { Avatar, Brand, Button, Card, PageTitle, Pill } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'

// Statut d'un compte de l'équipe
const USER_STATUS = {
  actif: { label: 'Actif', bg: '#e1eee2', fg: '#2f5a37' },
  invite: { label: 'Invitation envoyée', bg: '#fbefd5', fg: '#7a5200' },
  desactive: { label: 'Désactivé', bg: '#efebe3', fg: '#5e5b55' },
}
const ROLE_TONE = { bg: '#efebe3', fg: '#141414' }

const FILTERS = [
  { id: 'tous', label: 'Tous', test: () => true },
  { id: 'super_admin', label: 'Super admin', test: (u) => u.role === 'super_admin' },
  { id: 'employe', label: 'Employés', test: (u) => u.role === 'employe' },
  { id: 'livreur', label: 'Livreurs', test: (u) => u.role === 'livreur' },
  { id: 'invite', label: 'Invitations en attente', test: (u) => u.status === 'invite' },
]

const fullName = (u) => `${u.firstName} ${u.lastName}`
const editHref = (u) => `#admin/utilisateurs/${u.id}`

function matches(u, q) {
  const s = q.trim().toLowerCase()
  if (!s) return true
  const digits = s.replace(/\D/g, '')
  return (
    fullName(u).toLowerCase().includes(s) ||
    u.email.toLowerCase().includes(s) ||
    (u.brand && BRANDS[u.brand].name.toLowerCase().includes(s)) ||
    (digits.length >= 3 && (u.phone ?? '').replace(/\D/g, '').includes(digits))
  )
}

/** Maison (employé), zone (livreur) ou « Toutes les Maisons » (super admin) */
function Scope({ user }) {
  if (user.role === 'employe' && BRANDS[user.brand]) return <Brand id={user.brand} className="text-[13.5px]" />
  if (user.role === 'livreur') return <span className="text-d-muted">{user.vehicle ?? 'Moto'} · zone {user.zone ?? 'Gombe'}</span>
  return <span className="text-d-muted">Toutes les Maisons</span>
}

const LastSeen = ({ user, now }) =>
  user.lastSeenAt ? <span>{ago(user.lastSeenAt, now)}</span> : <span className="text-d-muted">Jamais</span>

/** Bouton « Renvoyer l’invitation » avec confirmation passagère */
function Resend({ user, sent, onSend, className = '' }) {
  if (user.status !== 'invite') return null
  return sent ? (
    <span role="status" className={`inline-flex items-center gap-1.5 text-[13px] text-[#2f5a37] ${className}`}>
      <Icon name="check" className="size-4" />
      Invitation renvoyée
    </span>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onSend(user.id)
      }}
      className={`text-[13px] underline decoration-d-border underline-offset-4 hover:decoration-d-ink ${className}`}
    >
      Renvoyer l’invitation
    </button>
  )
}

/** Utilisateurs de l'équipe et leurs rôles (super admin) */
export default function Users() {
  const { users, now, notify } = useStore()
  // Renvoyer l'invitation (l'e-mail partira quand le service d'e-mails sera branché)
  const resend = async (userId) => {
    try {
      const r = await api.post(`/users/invitations/${userId}/resend`)
      if (r?.sent === false) notify(`Invitation notée. ${r.reason ?? ''}`.trim(), 'ok')
      setResent(userId)
    } catch (err) {
      notify(err.message)
    }
  }
  const [filter, setFilter] = useState('tous')
  const [q, setQ] = useState('')
  const [resent, setResent] = useState(null) // id de la dernière invitation renvoyée

  useEffect(() => {
    if (!resent) return undefined
    const id = setTimeout(() => setResent(null), 3000)
    return () => clearTimeout(id)
  }, [resent])

  const sorted = useMemo(() => {
    const order = { super_admin: 0, employe: 1, livreur: 2 }
    return [...users].sort((a, b) => order[a.role] - order[b.role] || fullName(a).localeCompare(fullName(b), 'fr'))
  }, [users])

  const current = FILTERS.find((f) => f.id === filter)
  const visible = sorted.filter((u) => current.test(u) && matches(u, q))
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, sorted.filter(f.test).length]))

  const roleCards = [
    { id: 'super_admin', label: 'Super admin', count: counts.super_admin, icon: 'settings' },
    { id: 'employe', label: 'Employés', count: counts.employe, icon: 'store' },
    { id: 'livreur', label: 'Livreurs', count: counts.livreur, icon: 'bike' },
  ]

  return (
    <>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow="Équipe kclick" before="Utilisateurs et " accent="rôles" />
        <Button onClick={() => (window.location.hash = 'admin/utilisateurs/nouveau')} className="max-sm:w-full">
          <Icon name="plus" className="size-4" />
          Ajouter un utilisateur
        </Button>
      </header>

      {/* Les 3 rôles */}
      <div className="mb-7 grid gap-4 md:grid-cols-3">
        {roleCards.map((r) => (
          <Card key={r.id} as="article" className="flex gap-4 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-d-soft">
              <Icon name={r.icon} className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="flex items-baseline gap-2.5">
                <span className="text-[15px]">{r.label}</span>
                <span className="font-mono text-[22px] leading-none">{r.count}</span>
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-d-muted">{ROLES[r.id].text}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtres et recherche */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filtrer les utilisateurs" className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[13.5px] transition-colors ${
                filter === f.id ? 'border-d-ink bg-d-ink text-white' : 'border-d-line bg-white hover:border-d-border'
              }`}
            >
              {f.label}
              <span className={`font-mono text-xs ${filter === f.id ? 'text-white/70' : 'text-d-muted'}`}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="w-full sm:w-[300px]">
          <label className="flex h-11 items-center gap-3 rounded-[10px] border border-d-line bg-white px-4 focus-within:border-d-ink">
            <Icon name="search" className="size-4 shrink-0 text-d-muted" />
            <span className="sr-only">Rechercher un utilisateur</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, e-mail, Maison…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-d-muted"
            />
          </label>
        </form>
      </div>

      <Card className="overflow-hidden">
        {!visible.length ? (
          <p className="px-5 py-10 text-center text-sm text-d-muted">Aucun utilisateur ne correspond.</p>
        ) : (
          <>
            {/* Tablette et ordinateur */}
            <div className="overflow-x-auto max-sm:hidden">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-d-line text-[12.5px] text-d-muted">
                    <th scope="col" className="py-3 pl-5 pr-3 font-normal">Utilisateur</th>
                    <th scope="col" className="px-3 py-3 font-normal">Rôle</th>
                    <th scope="col" className="px-3 py-3 font-normal">Maison</th>
                    <th scope="col" className="px-3 py-3 font-normal">Statut</th>
                    <th scope="col" className="px-3 py-3 font-normal">Dernière connexion</th>
                    <th scope="col" className="py-3 pl-3 pr-5 font-normal"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((u) => (
                    <tr key={u.id} className={`border-b border-d-line last:border-0 ${u.status === 'desactive' ? 'opacity-60' : ''}`}>
                      <td className="py-3.5 pl-5 pr-3 align-middle">
                        <span className="flex items-center gap-3">
                          <Avatar name={fullName(u)} className="size-9 text-[12px]" />
                          <span className="min-w-0">
                            <span className="block">{fullName(u)}</span>
                            <span className="block truncate text-xs text-d-muted">{u.email}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        <Pill tone={ROLE_TONE}>{ROLES[u.role].label}</Pill>
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        <Scope user={u} />
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        <Pill tone={USER_STATUS[u.status]} />
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        <LastSeen user={u} now={now} />
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right align-middle">
                        <span className="flex items-center justify-end gap-4">
                          <Resend user={u} sent={resent === u.id} onSend={resend} />
                          <a href={editHref(u)} className="inline-flex h-9 items-center rounded-lg border border-d-line px-3.5 text-[13px] hover:border-d-ink" aria-label={`Modifier ${fullName(u)}`}>
                            Modifier
                          </a>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Téléphone */}
            <ul className="divide-y divide-d-line sm:hidden">
              {visible.map((u) => (
                <li key={u.id} className={u.status === 'desactive' ? 'opacity-60' : ''}>
                  <div className="flex flex-col gap-3 px-4 py-4">
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={fullName(u)} className="size-9 text-[12px]" />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px]">{fullName(u)}</span>
                          <span className="block truncate text-xs text-d-muted">{u.email}</span>
                        </span>
                      </span>
                      <Pill tone={USER_STATUS[u.status]} />
                    </span>
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                      <Pill tone={ROLE_TONE}>{ROLES[u.role].label}</Pill>
                      <Scope user={u} />
                    </span>
                    <span className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
                      <span className="text-d-muted">
                        Dernière connexion : <LastSeen user={u} now={now} />
                      </span>
                      <span className="flex items-center gap-4">
                        <Resend user={u} sent={resent === u.id} onSend={resend} />
                        <a href={editHref(u)} className="inline-flex h-9 items-center rounded-lg border border-d-line px-3.5 hover:border-d-ink" aria-label={`Modifier ${fullName(u)}`}>
                          Modifier
                        </a>
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <div className="mt-5 flex gap-3 rounded-[14px] border border-d-line bg-d-soft/60 px-5 py-4 text-[13px] leading-relaxed text-d-muted">
        <Icon name="bell" className="mt-0.5 size-4 shrink-0 text-d-ink" />
        <p>
          Chaque personne se connecte avec un code à 6 chiffres reçu par e-mail, sans mot de passe. Seul le super admin peut ajouter un utilisateur, changer un rôle ou désactiver un compte.
        </p>
      </div>
    </>
  )
}
