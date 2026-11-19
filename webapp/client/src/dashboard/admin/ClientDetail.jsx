import { useState } from 'react'
import { useStore } from '../store/store.jsx'
import { CLIENTS, LANGS, fullName, ordersOf, statsOf } from '../data/clients.js'
import { orderStatus } from '../lib/status.js'
import { hour, money, orderTotal, partTotal } from '../lib/format.js'
import { Avatar, Brand, Button, Card, CardTitle, DemoNote, Pill, StatusPill, telHref, waHref } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'

const longDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '')

const ACCOUNT = { bg: '#e1eee2', fg: '#2f5a37' }
const GUEST = { bg: '#efebe3', fg: '#5e5b55' }

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

/** Fiche d'un client : ses commandes, ses coordonnées, ses adresses, une note interne */
export default function ClientDetail({ id }) {
  const { orders } = useStore()
  const client = CLIENTS.find((c) => c.id === id)
  const [note, setNote] = useState(client?.notes ?? '')
  const [saved, setSaved] = useState(false)

  if (!client) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-[17px]">Ce client est introuvable.</p>
        <a href="#admin/clients" className="text-[13px] underline decoration-d-border underline-offset-4">Retour aux clients</a>
      </Card>
    )
  }

  const name = fullName(client)
  const stats = statsOf(client, orders)
  const today = ordersOf(client, orders)

  return (
    <>
      <nav aria-label="Fil d’Ariane" className="mb-4 text-[13px] text-d-muted">
        <a href="#admin/clients" className="underline decoration-d-border underline-offset-4 hover:text-d-ink">Clients</a>
        <span className="mx-1.5">/</span>
        <span className="text-d-ink">{name}</span>
      </nav>

      <header className="mb-7 flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={name} className="size-14 text-[17px]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(26px,3vw,34px)] font-light leading-tight">{name}</h1>
              <Pill tone={client.hasAccount ? ACCOUNT : GUEST}>{client.hasAccount ? 'Compte' : 'Sans compte'}</Pill>
            </div>
            <p className="mt-1 text-[13px] text-d-muted">
              Client depuis le {longDate(client.createdAt)}
              {stats.favourite && (
                <>
                  {' · '}préfère <Brand id={stats.favourite} className="text-d-ink" />
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 max-sm:w-full">
          <a href={telHref(client.phone)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-d-ink bg-white px-5 text-sm hover:bg-d-soft max-sm:flex-1">
            <Icon name="phone" className="size-4" /> Appeler
          </a>
          <a href={waHref(client.phone)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-d-ink bg-white px-5 text-sm hover:bg-d-soft max-sm:flex-1">
            <Icon name="whatsapp" className="size-4" /> WhatsApp
          </a>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
            <Stat label="Commandes" value={stats.count} />
            <Stat label="Total dépensé" value={money(stats.spent)} />
            <Stat label="Panier moyen" value={money(Math.round(stats.average))} />
            <Stat label="Dernière" value={stats.lastAt ? shortDate(stats.lastAt) : '—'} />
          </div>

          <Card className="overflow-hidden">
            <CardTitle className="px-5 pb-3 pt-5">Commandes du jour</CardTitle>
            {today.length ? (
              <ul className="divide-y divide-d-line border-t border-d-line">
                {today.map((o) => {
                  const total = orderTotal(o) || o.parts.reduce((a, p) => a + partTotal(p), 0)
                  return (
                    <li key={o.number}>
                      <a href={`#admin/commandes/${o.number}`} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-4 hover:bg-[#faf9f6]">
                        <span className="min-w-0">
                          <span className="font-mono text-[13.5px] underline decoration-d-border underline-offset-4">{o.number}</span>
                          <span className="mt-1 block text-xs text-d-muted">
                            Aujourd’hui, {hour(o.createdAt)} · {o.mode === 'livraison' ? 'Livraison' : 'Retrait'}
                          </span>
                        </span>
                        <span className="flex gap-3 text-[13px]">
                          {o.parts.map((p) => (
                            <Brand key={p.brand} id={p.brand} />
                          ))}
                        </span>
                        <span className="flex items-center gap-4">
                          <span className="font-mono">{money(total)}</span>
                          <StatusPill status={orderStatus(o)} />
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="border-t border-d-line px-5 py-6 text-sm text-d-muted">Aucune commande aujourd’hui.</p>
            )}

            {client.pastOrders.length > 0 && (
              <>
                <h3 className="border-t border-d-line px-5 pb-2 pt-5 text-[13px] text-d-muted">Commandes précédentes</h3>
                <ul className="px-5 pb-4">
                  {client.pastOrders.map((p) => (
                    <li key={p.at} className="flex items-center justify-between gap-4 py-2 text-sm">
                      <span className="text-d-muted">{shortDate(p.at)}</span>
                      <Brand id={p.brand} className="flex-1" />
                      <span className="font-mono">{money(p.total)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card className="px-5 py-5">
            <CardTitle>Coordonnées</CardTitle>
            <dl className="mt-2 divide-y divide-d-line">
              <Row label="E-mail">
                <a href={`mailto:${client.email}`} className="underline decoration-d-border underline-offset-4">{client.email}</a>
              </Row>
              <Row label="Téléphone">
                <span className="font-mono text-[13px]">{client.phone}</span>
              </Row>
              <Row label="Langue">{LANGS[client.lang]}</Row>
              <Row label="Newsletter">{client.newsletter ? 'Inscrit' : 'Non'}</Row>
            </dl>
          </Card>

          <Card className="px-5 py-5">
            <CardTitle>Adresses enregistrées</CardTitle>
            {client.addresses.length ? (
              <ul className="mt-3 flex flex-col gap-3">
                {client.addresses.map((a) => (
                  <li key={a.label + a.street} className="flex gap-3 rounded-[10px] border border-d-line px-4 py-3 text-sm">
                    <Icon name="pin" className="mt-0.5 size-4 shrink-0 text-d-muted" />
                    <span>
                      <span className="block text-xs text-d-muted">{a.label}</span>
                      {a.commune}, {a.street}
                      {a.landmark && <span className="block text-d-muted">Repère : {a.landmark}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-d-muted">
                {client.hasAccount ? 'Aucune adresse enregistrée.' : 'Commande sans compte : l’adresse est gardée sur chaque commande.'}
              </p>
            )}
          </Card>

          <Card className="px-5 py-5">
            <label htmlFor="client-note" className="text-[17px] font-medium">
              Note interne
            </label>
            <p className="mt-1 text-xs text-d-muted">Visible seulement par l’équipe.</p>
            <textarea
              id="client-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                setSaved(false)
              }}
              rows={4}
              placeholder="Préférences, consignes de livraison…"
              className="mt-3 w-full resize-y rounded-[10px] border border-d-line bg-white px-3.5 py-3 text-sm outline-none focus:border-d-ink"
            />
            <div className="mt-3 flex items-center gap-3">
              <Button size="sm" onClick={() => setSaved(true)} disabled={note === client.notes && !saved}>
                Enregistrer
              </Button>
              {saved && (
                <span role="status" className="inline-flex items-center gap-1.5 text-[13px] text-[#2f6b40]">
                  <Icon name="check" className="size-4" /> Note enregistrée
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>
      <DemoNote className="mt-6" />
    </>
  )
}
