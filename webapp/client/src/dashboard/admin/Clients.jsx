import { useMemo, useState } from 'react'
import { useStore } from '../store/store.jsx'
import { CLIENTS, fullName, statsOf } from '../data/clients.js'
import { money } from '../lib/format.js'
import { Avatar, Brand, Card, DemoNote, PageTitle } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'

const FILTERS = [
  { id: 'tous', label: 'Tous', test: () => true },
  { id: 'compte', label: 'Avec compte', test: (c) => c.hasAccount },
  { id: 'sans', label: 'Sans compte', test: (c) => !c.hasAccount },
  { id: 'newsletter', label: 'Newsletter', test: (c) => c.newsletter },
]

const shortDate = (date) =>
  date ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '') : '—'

const href = (c) => `#admin/clients/${c.id}`

function matches(c, q) {
  const s = q.trim().toLowerCase()
  if (!s) return true
  const d = s.replace(/\D/g, '')
  return (
    fullName(c).toLowerCase().includes(s) ||
    c.email.toLowerCase().includes(s) ||
    (d.length >= 3 && c.phone.replace(/\D/g, '').includes(d))
  )
}

function Kpi({ label, value, note }) {
  return (
    <Card className="px-4 py-4 sm:px-5 sm:py-[18px]">
      <p className="mb-3 text-[13px] text-d-muted">{label}</p>
      <p className="font-mono text-[clamp(24px,7vw,32px)] leading-none tracking-[-0.02em]">{value}</p>
      <p className="mt-3 text-xs text-d-muted">{note}</p>
    </Card>
  )
}

/** Clients : comptes et clients qui ont commandé sans compte */
export default function Clients() {
  const { orders } = useStore()
  const [filter, setFilter] = useState('tous')
  const [q, setQ] = useState('')

  const rows = useMemo(
    () =>
      CLIENTS.map((c) => ({ ...c, stats: statsOf(c, orders) })).sort(
        (a, b) => new Date(b.stats.lastAt ?? 0) - new Date(a.stats.lastAt ?? 0),
      ),
    [orders],
  )

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const withAccount = rows.filter((c) => c.hasAccount).length
  const newThisMonth = rows.filter((c) => new Date(c.createdAt) >= monthStart).length
  const allOrders = rows.reduce((a, c) => a + c.stats.count, 0)
  const basket = allOrders ? rows.reduce((a, c) => a + c.stats.spent, 0) / allOrders : 0

  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, rows.filter(f.test).length]))
  const current = FILTERS.find((f) => f.id === filter)
  const visible = rows.filter((c) => current.test(c) && matches(c, q))

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow="Comptes et commandes sans compte" before="Cli" accent="ents" />
        <form role="search" onSubmit={(e) => e.preventDefault()} className="w-full sm:w-[320px]">
          <label className="flex h-11 items-center gap-3 rounded-[10px] border border-d-line bg-white px-4 focus-within:border-d-ink">
            <Icon name="search" className="size-4 shrink-0 text-d-muted" />
            <span className="sr-only">Rechercher un client</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, téléphone, e-mail…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-d-muted"
            />
          </label>
        </form>
      </header>

      <div className="mb-6 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:gap-3">
        <Kpi label="Clients" value={rows.length} note="Avec au moins une commande ou un compte" />
        <Kpi label="Avec compte" value={withAccount} note={`${Math.round((withAccount / rows.length) * 100)} % des clients`} />
        <Kpi label="Nouveaux ce mois" value={newThisMonth} note="Premier achat ou inscription" />
        <Kpi label="Panier moyen" value={money(Math.round(basket))} note="Toutes commandes, hors annulées" />
      </div>

      <div role="tablist" aria-label="Filtrer les clients" className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
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

      <Card className="overflow-hidden">
        {!visible.length ? (
          <p className="px-5 py-12 text-center text-sm text-d-muted">Aucun client ne correspond à cette recherche.</p>
        ) : (
          <>
            <div className="overflow-x-auto max-sm:hidden">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-d-line text-[12.5px] text-d-muted">
                    <th scope="col" className="py-3 pl-5 pr-3 font-normal">Client</th>
                    <th scope="col" className="px-3 py-3 font-normal">Téléphone</th>
                    <th scope="col" className="px-3 py-3 text-right font-normal">Commandes</th>
                    <th scope="col" className="px-3 py-3 text-right font-normal">Total dépensé</th>
                    <th scope="col" className="px-3 py-3 font-normal">Dernière commande</th>
                    <th scope="col" className="py-3 pl-3 pr-5 font-normal">Maison préférée</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => (window.location.hash = href(c).slice(1))}
                      className="cursor-pointer border-b border-d-line transition-colors last:border-0 hover:bg-[#faf9f6]"
                    >
                      <td className="py-3.5 pl-5 pr-3 align-middle">
                        <a href={href(c)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                          <Avatar name={fullName(c)} className="size-9 text-[12px]" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              {fullName(c)}
                              {!c.hasAccount && <span className="rounded-full bg-d-soft px-2 py-0.5 text-[11px] text-d-muted">Sans compte</span>}
                            </span>
                            <span className="block truncate text-xs text-d-muted">{c.email}</span>
                          </span>
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 align-middle font-mono text-[13px]">{c.phone}</td>
                      <td className="px-3 py-3.5 text-right align-middle font-mono">{c.stats.count}</td>
                      <td className="px-3 py-3.5 text-right align-middle font-mono">{money(c.stats.spent)}</td>
                      <td className="px-3 py-3.5 align-middle text-d-muted">{shortDate(c.stats.lastAt)}</td>
                      <td className="py-3.5 pl-3 pr-5 align-middle">
                        {c.stats.favourite ? <Brand id={c.stats.favourite} className="text-[13.5px]" /> : <span className="text-d-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-d-line sm:hidden">
              {visible.map((c) => (
                <li key={c.id}>
                  <a href={href(c)} className="flex flex-col gap-2.5 px-4 py-4 active:bg-[#faf9f6]">
                    <span className="flex items-center gap-3">
                      <Avatar name={fullName(c)} className="size-9 text-[12px]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{fullName(c)}</span>
                        <span className="block truncate font-mono text-xs text-d-muted">{c.phone}</span>
                      </span>
                      <span className="font-mono text-[15px]">{money(c.stats.spent)}</span>
                    </span>
                    <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] text-d-muted">
                      <span>
                        {c.stats.count} commande{c.stats.count > 1 ? 's' : ''} · {shortDate(c.stats.lastAt)}
                        {!c.hasAccount && ' · sans compte'}
                      </span>
                      {c.stats.favourite && <Brand id={c.stats.favourite} className="text-d-ink" />}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <DemoNote className="mt-5" />
    </>
  )
}
