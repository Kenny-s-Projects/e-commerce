import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { dateLocale, hour, money } from '../lib/format.js'
import { Avatar, Brand, Card, CardTitle, Pill, StatusPill, telHref, waHref } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { tr } from '../lib/i18n.js'

const longDate = (date) => new Date(date).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = (date) => new Date(date).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' }).replace('.', '')
const isToday = (date) => new Date(date).toDateString() === new Date().toDateString()

const ACCOUNT = { bg: '#e1eee2', fg: '#2f5a37' }
const GUEST = { bg: '#efebe3', fg: '#5e5b55' }
const LANGS = { fr: 'Français', en: 'English' }

// Statut enregistré d'une commande → statut affiché (pastille)
const DISPLAY = { en_attente: 'nouvelle', en_cours: 'en_preparation', prete_retrait: 'prete', en_livraison: 'en_route', livree: 'livree', retiree: 'livree', refusee: 'annulee', annulee: 'annulee' }

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-d-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right">{children}</dd>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-[10px] bg-d-soft px-4 py-3">
      <p className="text-xs text-d-muted">{label}</p>
      <p className="mt-1.5 font-mono text-[20px] leading-none">{value}</p>
    </div>
  )
}

/** Fiche d'un client (GET /clients/:key) : ses commandes, ses coordonnées, ses adresses */
export default function ClientDetail({ id }) {
  const [client, setClient] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .get(`/clients/${encodeURIComponent(id)}`)
      .then((c) => alive && setClient(c))
      .catch((err) => alive && setError(err))
    return () => {
      alive = false
    }
  }, [id])

  if (error || !client) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-[17px]">{error ? (error.status === 404 ? tr('Ce client est introuvable.') : tr(error.message)) : tr('Chargement du client…')}</p>
        {error && <a href="#admin/clients" className="text-[13px] underline decoration-d-border underline-offset-4">{tr('Retour aux clients')}</a>}
      </Card>
    )
  }

  const name = client.name || tr('Client')
  const kept = client.orders.filter((o) => !['annulee', 'refusee'].includes(o.status))
  const average = kept.length ? client.totalSpent / kept.length : 0

  return (
    <>
      <nav aria-label={tr('Fil d’Ariane')} className="mb-4 text-[13px] text-d-muted">
        <a href="#admin/clients" className="underline decoration-d-border underline-offset-4 hover:text-d-ink">{tr('Clients')}</a>
        <span className="mx-1.5">/</span>
        <span className="text-d-ink">{name}</span>
      </nav>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={name} className="size-14 text-[17px]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(26px,3vw,34px)] font-light leading-tight">{name}</h1>
              <Pill tone={client.hasAccount ? ACCOUNT : GUEST}>{client.hasAccount ? tr('Compte') : tr('Sans compte')}</Pill>
            </div>
            <p className="mt-1 text-[13px] text-d-muted">
              {tr('Client depuis le {date}', { date: longDate(client.createdAt) })}
              {client.favoriteBrand && (
                <>
                  {' · '}{tr('préfère')} <Brand id={client.favoriteBrand} className="text-d-ink" />
                </>
              )}
            </p>
          </div>
        </div>
        {client.phone && (
          <div className="flex gap-2.5 max-sm:w-full">
            <a href={telHref(client.phone)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-d-ink bg-white px-5 text-sm hover:bg-d-soft max-sm:flex-1">
              <Icon name="phone" className="size-4" /> {tr('Appeler')}
            </a>
            <a href={waHref(client.phone)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-d-ink bg-white px-5 text-sm hover:bg-d-soft max-sm:flex-1">
              <Icon name="whatsapp" className="size-4" /> WhatsApp
            </a>
          </div>
        )}
      </header>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
            <Stat label={tr('Commandes')} value={client.ordersCount} />
            <Stat label={tr('Total dépensé')} value={money(client.totalSpent)} />
            <Stat label={tr('Panier moyen')} value={money(Math.round(average))} />
            <Stat label={tr('Dernière')} value={client.lastOrderAt ? shortDate(client.lastOrderAt) : '—'} />
          </div>

          <Card className="overflow-hidden">
            <CardTitle className="px-5 pb-3 pt-5">{tr('Commandes')}</CardTitle>
            {client.orders.length ? (
              <ul className="divide-y divide-d-line border-t border-d-line">
                {client.orders.map((o) => (
                  <li key={o.number}>
                    <a href={`#admin/commandes/${o.number}`} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-4 hover:bg-[#faf9f6]">
                      <span className="min-w-0">
                        <span className="font-mono text-[13.5px] underline decoration-d-border underline-offset-4">{o.number}</span>
                        <span className="mt-1 block text-xs text-d-muted">
                          {isToday(o.createdAt) ? tr('Aujourd’hui, {time}', { time: hour(o.createdAt) }) : shortDate(o.createdAt)} · {o.mode === 'livraison' ? tr('Livraison') : tr('Retrait')}
                        </span>
                      </span>
                      <span className="flex gap-3 text-[13px]">
                        {(o.brands ?? []).map((b) => (
                          <Brand key={b} id={b} />
                        ))}
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="font-mono">{money(o.total)}</span>
                        <StatusPill status={DISPLAY[o.status] ?? 'nouvelle'} />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-d-line px-5 py-6 text-sm text-d-muted">{tr('Aucune commande pour l’instant.')}</p>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card className="px-5 py-5">
            <CardTitle>{tr('Coordonnées')}</CardTitle>
            <dl className="mt-2 divide-y divide-d-line">
              <Row label={tr('E-mail')}>
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="underline decoration-d-border underline-offset-4">{client.email}</a>
                ) : (
                  <span className="text-d-muted">{tr('Non renseigné')}</span>
                )}
              </Row>
              <Row label={tr('Téléphone')}>
                <span className="font-mono text-[13px]">{client.phone || '—'}</span>
              </Row>
              <Row label={tr('Langue')}>{LANGS[client.lang] ?? '—'}</Row>
            </dl>
          </Card>

          <Card className="px-5 py-5">
            <CardTitle>{tr('Adresses enregistrées')}</CardTitle>
            {client.addresses.length ? (
              <ul className="mt-3 flex flex-col gap-3">
                {client.addresses.map((a) => (
                  <li key={a.id} className="flex gap-3 rounded-[10px] border border-d-line px-4 py-3 text-sm">
                    <Icon name="pin" className="mt-0.5 size-4 shrink-0 text-d-muted" />
                    <span>
                      {a.label && <span className="block text-xs text-d-muted">{a.label}</span>}
                      {a.commune}
                      {a.street ? `, ${a.street}` : ''}
                      {a.landmark && <span className="block text-d-muted">{tr('Repère :')} {a.landmark}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-d-muted">
                {client.hasAccount ? tr('Aucune adresse enregistrée.') : tr('Commande sans compte : l’adresse est gardée sur chaque commande.')}
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
