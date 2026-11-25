import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { dateLocale, money } from '../lib/format.js'
import { Card, PageTitle } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { tr } from '../lib/i18n.js'

// Filtres : paiements par statut, ou remboursements
const FILTERS = [
  { id: 'tous', label: 'Tous', query: {} },
  { id: 'en_attente', label: 'En attente', query: { kind: 'paiement', status: 'en_attente' } },
  { id: 'paye', label: 'Payés', query: { kind: 'paiement', status: 'paye' } },
  { id: 'echoue', label: 'Échoués', query: { kind: 'paiement', status: 'echoue' } },
  { id: 'remboursement', label: 'Remboursements', query: { kind: 'remboursement' } },
]

// Statut kclick → libellé et couleurs
const STATUS = {
  en_attente: { label: 'En attente', bg: '#f6ead2', fg: '#86671f' },
  paye: { label: 'Payé', bg: '#dcebdd', fg: '#2f6b40' },
  echoue: { label: 'Échoué', bg: '#f7deda', fg: '#a2392b' },
  rembourse: { label: 'Remboursé', bg: '#e4e7ef', fg: '#3c4a6b' },
  annule: { label: 'Annulé', bg: '#ecebe7', fg: '#6b675e' },
}
const METHOD = { mobile_money: 'Mobile money', carte: 'Carte' }

const dateTime = (d) =>
  d ? new Date(d).toLocaleString(dateLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '') : '—'

function StatusPill({ status, kind }) {
  const s = STATUS[status] ?? STATUS.annule
  const label = kind === 'remboursement' && status === 'en_attente' ? 'À rembourser' : s.label
  return (
    <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium" style={{ background: s.bg, color: s.fg }}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {tr(label)}
    </span>
  )
}

/** Paiements : chaque tentative, son statut kclick, le dernier statut MaishaPay et ses références */
export default function Payments() {
  const [filter, setFilter] = useState('tous')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    const f = FILTERS.find((x) => x.id === filter)
    return api
      .get('/payments', { ...f.query, q: search || undefined, limit: 200 })
      .then((d) => {
        setData(d)
        setError('')
      })
      .catch((err) => setError(err.message))
  }, [filter, search])

  // Chargement, puis rafraîchissement toutes les 20 s (paiements en attente qui se confirment)
  useEffect(() => {
    let alive = true
    const run = () => alive && load()
    const first = setTimeout(run, 0)
    const id = setInterval(run, 20_000)
    return () => {
      alive = false
      clearTimeout(first)
      clearInterval(id)
    }
  }, [load])

  const rows = data?.items ?? []

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={tr('Mobile money et carte · MaishaPay')} before={tr('Paie')} accent={tr('ments')} />
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(q.trim())
          }}
          className="w-full sm:w-[340px]"
        >
          <label className="flex h-11 items-center gap-3 rounded-[10px] border border-d-line bg-white px-4 focus-within:border-d-ink">
            <Icon name="search" className="size-4 shrink-0 text-d-muted" />
            <span className="sr-only">{tr('Rechercher un paiement')}</span>
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                if (!e.target.value) setSearch('')
              }}
              placeholder={tr('Commande, référence, client…')}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-d-muted"
            />
          </label>
        </form>
      </header>

      <div role="tablist" aria-label={tr('Filtrer les paiements')} className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`flex h-9 shrink-0 items-center rounded-full border px-4 text-[13.5px] transition-colors ${
              filter === f.id ? 'border-d-ink bg-d-ink text-white' : 'border-d-line bg-white hover:border-d-border'
            }`}
          >
            {tr(f.label)}
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto flex h-9 shrink-0 items-center gap-2 rounded-full border border-d-line bg-white px-4 text-[13px] hover:border-d-border">
          {tr('Actualiser')}
        </button>
      </div>

      <Card className="overflow-hidden">
        {!data ? (
          <p className="px-5 py-12 text-center text-sm text-d-muted">{error ? tr(error) : tr('Chargement des paiements…')}</p>
        ) : !rows.length ? (
          <p className="px-5 py-12 text-center text-sm text-d-muted">{search ? tr('Aucun paiement ne correspond à cette recherche.') : tr('Aucun paiement pour ce filtre.')}</p>
        ) : (
          <>
            {/* Ordinateur : tableau */}
            <div className="overflow-x-auto max-md:hidden">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-d-line text-[12.5px] text-d-muted">
                    <th scope="col" className="py-3 pl-5 pr-3 font-normal">{tr('Date')}</th>
                    <th scope="col" className="px-3 py-3 font-normal">{tr('Commande')}</th>
                    <th scope="col" className="px-3 py-3 font-normal">{tr('Moyen')}</th>
                    <th scope="col" className="px-3 py-3 text-right font-normal">{tr('Montant')}</th>
                    <th scope="col" className="px-3 py-3 text-right font-normal">{tr('Frais')}</th>
                    <th scope="col" className="px-3 py-3 font-normal">{tr('Statut')}</th>
                    <th scope="col" className="px-3 py-3 font-normal">{tr('Statut MaishaPay')}</th>
                    <th scope="col" className="py-3 pl-3 pr-5 font-normal">{tr('Références')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-d-line align-top last:border-0">
                      <td className="whitespace-nowrap py-3.5 pl-5 pr-3 text-[13px]">{dateTime(p.created_at)}</td>
                      <td className="px-3 py-3.5">
                        <a href={`#admin/commandes/${p.order_number}`} className="font-mono text-[13px] underline decoration-d-border underline-offset-4 hover:decoration-d-ink">
                          {p.order_number}
                        </a>
                        <span className="block text-xs text-d-muted">{p.customer_name}</span>
                      </td>
                      <td className="px-3 py-3.5 text-[13px]">
                        {tr(METHOD[p.method] ?? p.method)}
                        {p.provider && <span className="block text-xs text-d-muted">{p.provider}</span>}
                        {p.payer_phone && <span className="block font-mono text-xs text-d-muted">{p.payer_phone}</span>}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono">
                        {p.kind === 'remboursement' ? '−' : ''}
                        {money(p.amount)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-[13px] text-d-muted">{p.fees != null ? money(p.fees) : '—'}</td>
                      <td className="px-3 py-3.5">
                        <StatusPill status={p.status} kind={p.kind} />
                        {p.failure_reason && <span className="mt-1 block max-w-[200px] text-xs text-d-muted">{tr(p.failure_reason)}</span>}
                        {p.paid_at && <span className="mt-1 block text-xs text-d-muted">{tr('le {d}', { d: dateTime(p.paid_at) })}</span>}
                      </td>
                      <td className="px-3 py-3.5 font-mono text-[12.5px]">
                        {p.provider_status ?? (p.started_at ? '—' : <span className="font-sans text-d-muted">{tr('Pas encore lancé')}</span>)}
                        {p.checked_at && <span className="block font-sans text-xs text-d-muted">{tr('vérifié {d}', { d: dateTime(p.checked_at) })}</span>}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 font-mono text-[12px]">
                        {p.reference && <span className="block">{p.reference}</span>}
                        {p.provider_tx_id && <span className="block text-d-muted">MaishaPay #{p.provider_tx_id}</span>}
                        {!p.reference && p.provider_ref && <span className="block text-d-muted">{p.provider_ref}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile : cartes */}
            <ul className="divide-y divide-d-line md:hidden">
              {rows.map((p) => (
                <li key={p.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a href={`#admin/commandes/${p.order_number}`} className="font-mono text-[13px] underline underline-offset-4">{p.order_number}</a>
                      <p className="truncate text-xs text-d-muted">{p.customer_name} · {tr(METHOD[p.method] ?? p.method)}{p.provider ? ` · ${p.provider}` : ''}</p>
                    </div>
                    <p className="font-mono">{p.kind === 'remboursement' ? '−' : ''}{money(p.amount)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-d-muted">
                    <StatusPill status={p.status} kind={p.kind} />
                    {p.provider_status && <span className="font-mono">MaishaPay : {p.provider_status}</span>}
                    <span>{dateTime(p.created_at)}</span>
                  </div>
                  {p.failure_reason && <p className="mt-1 text-xs text-d-muted">{tr(p.failure_reason)}</p>}
                  {(p.reference || p.provider_tx_id) && (
                    <p className="mt-1 break-all font-mono text-[11.5px] text-d-muted">
                      {p.reference}
                      {p.provider_tx_id ? ` · #${p.provider_tx_id}` : ''}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      {data && <p className="mt-3 text-xs text-d-muted">{tr('{n} paiement(s)', { n: data.total })} · {tr('Les statuts se mettent à jour tout seuls toutes les 20 s.')}</p>}
    </>
  )
}
