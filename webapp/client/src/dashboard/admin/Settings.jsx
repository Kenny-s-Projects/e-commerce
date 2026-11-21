import { useEffect, useState } from 'react'
import { BRANDS } from '../data/demo.js'
import { useStore } from '../store/store.jsx'
import { api } from '../../lib/api.js'
import { Brand, Button, Card, PageTitle, Toggle } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { tr } from '../lib/i18n.js'

const SECTIONS = [
  { id: 'general', label: 'Général', text: 'Plateforme, contact, langue' },
  { id: 'livraison', label: 'Livraison', text: 'Zones, frais, retrait' },
  { id: 'paiements', label: 'Paiements', text: 'Mobile money, carte' },
  { id: 'notifications', label: 'Notifications', text: 'E-mails, son' },
  { id: 'maisons', label: 'Maisons', text: 'Ouverture, horaires' },
  { id: 'securite', label: 'Sécurité', text: 'Connexion, sessions' },
]

const OPERATORS = { mpesa: 'M-Pesa', orange: 'Orange Money', airtel: 'Airtel Money' }
const WEEKDAYS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'] // traduits à l'affichage

// Horaires enregistrés d'une Maison, en une ligne (« lun–sam · 09:00–20:00 »)
function hoursText(hours = []) {
  if (!hours.length) return tr('Horaires à renseigner')
  const days = hours.map((h) => tr(WEEKDAYS[h.weekday]))
  const h = hours[0]
  return `${days[0]}${days.length > 1 ? `–${days.at(-1)}` : ''} · ${h.opens_at ?? '?'}–${h.closes_at ?? '?'}`
}

/** GET /settings + /brands → valeurs du formulaire */
function fromApi(settings, brands) {
  const g = settings.general ?? {}
  const d = settings.delivery ?? {}
  const p = settings.payments ?? {}
  const n = settings.notifications ?? {}
  const sec = settings.security ?? {}
  const pickup = brands.find((b) => b.is_pickup_point)
  return {
    platform: g.platform ?? '',
    company: g.company ?? '',
    supportEmail: g.supportEmail ?? '',
    whatsapp: g.whatsapp ?? '',
    address: g.address ?? '',
    lang: g.defaultLang ?? 'fr',
    zones: (d.zones ?? []).map((z, i) => ({ id: `z${i}`, ...z })),
    cutoff: d.sameDayCutoff ?? '17:00',
    cancelDelay: String(d.cancelWindowMinutes ?? 15),
    pickupBrand: pickup?.slug ?? null,
    pickup: pickup?.pickup_address ?? '',
    mobileMoney: p.mobileMoney?.enabled ?? true,
    operators: Object.fromEntries(Object.entries(OPERATORS).map(([k, label]) => [label, p.mobileMoney?.operators?.[k] ?? true])),
    card: p.card?.enabled ?? true,
    provider: p.provider ?? '',
    clientMails: {
      confirmation: n.customerEmails?.confirmation ?? true,
      prete: n.customerEmails?.ready ?? true,
      route: n.customerEmails?.onTheWay ?? true,
      livree: n.customerEmails?.delivered ?? true,
    },
    recipients: n.teamRecipients ?? [],
    sound: n.newOrderSound ?? true,
    hours: Object.fromEntries(brands.map((b) => [b.slug, b.hours ?? []])),
    codeValidity: String(sec.codeValidityMinutes ?? 10),
    idle: String(sec.idleLogoutMinutes ?? 60),
  }
}

/** Valeurs du formulaire → corps de PUT /settings/:section */
const toApi = {
  general: (s) => ({ platform: s.platform, company: s.company, supportEmail: s.supportEmail, whatsapp: s.whatsapp, address: s.address, defaultLang: s.lang, currency: 'USD' }), // tout le site est en dollars
  delivery: (s) => ({
    zones: s.zones.map(({ commune, fee, delay, active }) => ({ commune: commune.trim(), fee: Number(fee), delay, active })),
    sameDayCutoff: s.cutoff,
    cancelWindowMinutes: Number(s.cancelDelay),
  }),
  payments: (s) => ({
    mobileMoney: { enabled: s.mobileMoney, operators: Object.fromEntries(Object.entries(OPERATORS).map(([k, label]) => [k, !!s.operators[label]])) },
    card: { enabled: s.card },
    cashOnDelivery: false,
    provider: s.provider.trim() || null,
  }),
  notifications: (s) => ({
    customerEmails: { confirmation: s.clientMails.confirmation, ready: s.clientMails.prete, onTheWay: s.clientMails.route, delivered: s.clientMails.livree },
    teamRecipients: s.recipients,
    newOrderSound: s.sound,
  }),
  security: (s) => ({ codeValidityMinutes: Number(s.codeValidity), idleLogoutMinutes: Number(s.idle) }),
}

const input =
  'h-11 w-full rounded-[10px] border border-d-line bg-white px-3.5 text-sm outline-none transition-colors focus:border-d-ink disabled:bg-d-soft disabled:text-d-muted'

function Field({ id, label, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-d-muted">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-d-muted">{hint}</p>}
    </div>
  )
}

/** Ligne avec un interrupteur : titre, explication, interrupteur à droite */
function Switch({ title, text, checked, onChange, disabled }) {
  return (
    <div className={`flex items-center justify-between gap-5 py-3.5 ${disabled ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <p className="text-sm">{title}</p>
        {text && <p className="mt-0.5 text-xs text-d-muted">{text}</p>}
      </div>
      {disabled ? (
        <span className="relative h-6 w-11 shrink-0 rounded-full bg-[#cfc9bd]" aria-label={tr('{title} : désactivé', { title })}>
          <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white" />
        </span>
      ) : (
        <Toggle checked={checked} onChange={onChange} label={<span className="sr-only">{title}</span>} />
      )}
    </div>
  )
}

function Section({ title, text, children }) {
  return (
    <Card className="px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-[17px] font-medium">{title}</h2>
      {text && <p className="mt-1 text-[13px] text-d-muted">{text}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  )
}

/** Paramètres de la plateforme (GET /settings, PUT /settings/:section ; Maisons via /brands) */
export default function Settings() {
  const [loaded, setLoaded] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    Promise.all([api.get('/settings'), api.get('/brands')])
      .then(([settings, brands]) => alive && setLoaded(fromApi(settings, brands)))
      .catch((err) => alive && setError(err.message))
    return () => {
      alive = false
    }
  }, [])
  if (!loaded)
    return (
      <>
        <PageTitle eyebrow={tr('Super admin')} before={tr('Para')} accent={tr('mètres')} />
        <Card className="mt-6 px-5 py-12 text-center text-sm text-d-muted">{tr(error) || tr('Chargement des paramètres…')}</Card>
      </>
    )
  return <SettingsForm initial={loaded} />
}

function SettingsForm({ initial }) {
  const { shopsOpen, dispatch } = useStore()
  const [section, setSection] = useState('general')
  const [saved, setSaved] = useState(initial)
  const [s, setS] = useState(initial)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [newRecipient, setNewRecipient] = useState('')

  const dirty = JSON.stringify(s) !== JSON.stringify(saved)
  const set = (patch) => {
    setS((prev) => ({ ...prev, ...patch }))
    setDone(false)
    setSaveError('')
  }
  const setZone = (id, patch) => set({ zones: s.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)) })

  // Enregistre seulement les rubriques modifiées (une requête par rubrique)
  const save = async () => {
    setSaving(true)
    setSaveError('')
    try {
      for (const [section, build] of Object.entries(toApi)) {
        if (JSON.stringify(build(s)) !== JSON.stringify(build(saved))) await api.put(`/settings/${section}`, build(s))
      }
      if (s.pickupBrand && s.pickup !== saved.pickup) await api.patch(`/brands/${s.pickupBrand}`, { pickupAddress: s.pickup.trim() })
      setSaved(s)
      setDone(true)
    } catch (err) {
      setSaveError(err.details?.length ? `${tr(err.message)} : ${err.details.map((d) => d.message).join(', ')}` : tr(err.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={tr('Super admin')} before={tr('Para')} accent={tr('mètres')} />
        <div className="flex items-center gap-3 max-sm:w-full">
          {done && !dirty && (
            <span role="status" className="inline-flex items-center gap-1.5 text-[13px] text-[#2f6b40]">
              <Icon name="check" className="size-4" /> {tr('Modifications enregistrées')}
            </span>
          )}
          {dirty && <span className="text-[13px] text-d-gold-ink max-sm:hidden">{tr('Modifications non enregistrées')}</span>}
          <Button onClick={save} disabled={!dirty || saving} className="max-sm:hidden">
            {saving ? tr('Enregistrement…') : tr('Enregistrer les modifications')}
          </Button>
        </div>
        {saveError && (
          <p role="alert" className="w-full rounded-[10px] bg-[#f7deda] px-4 py-3 text-sm text-[#8e2118]">
            {saveError}
          </p>
        )}
      </header>

      <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-6 max-lg:grid-cols-1">
        <nav aria-label={tr('Rubriques des paramètres')} className="max-lg:-mx-1 max-lg:overflow-x-auto max-lg:px-1 max-lg:pb-1">
          <ul className="flex flex-col gap-1 max-lg:flex-row max-lg:gap-1.5">
            {SECTIONS.map((x) => {
              const active = section === x.id
              return (
                <li key={x.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSection(x.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`w-full text-left transition-colors lg:rounded-[10px] lg:px-4 lg:py-3 max-lg:flex max-lg:h-9 max-lg:items-center max-lg:rounded-full max-lg:border max-lg:px-4 max-lg:text-[13.5px] ${
                      active
                        ? 'lg:bg-white lg:shadow-[inset_0_0_0_1px_var(--color-d-line)] max-lg:border-d-ink max-lg:bg-d-ink max-lg:text-white'
                        : 'lg:hover:bg-white/60 max-lg:border-d-line max-lg:bg-white'
                    }`}
                  >
                    <span className="block text-[14.5px] max-lg:text-[13.5px]">{tr(x.label)}</span>
                    <span className="block text-xs text-d-muted max-lg:hidden">{tr(x.text)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-5">
          {section === 'general' && (
            <Section title={tr('Général')} text={tr('Informations affichées aux clients sur le site et dans les e-mails.')}>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Field id="set-platform" label={tr('Nom de la plateforme')}>
                  <input id="set-platform" className={input} value={s.platform} onChange={(e) => set({ platform: e.target.value })} />
                </Field>
                <Field id="set-company" label={tr('Société')}>
                  <input id="set-company" className={input} value={s.company} onChange={(e) => set({ company: e.target.value })} />
                </Field>
                <Field id="set-email" label={tr('E-mail du service client')}>
                  <input id="set-email" type="email" className={input} value={s.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} />
                </Field>
                <Field id="set-wa" label={tr('WhatsApp de la conciergerie')}>
                  <input id="set-wa" type="tel" className={`${input} font-mono`} value={s.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />
                </Field>
                <Field id="set-address" label={tr('Adresse')} className="sm:col-span-2">
                  <input id="set-address" className={input} value={s.address} onChange={(e) => set({ address: e.target.value })} />
                </Field>
                <Field id="set-lang" label={tr('Langue par défaut du site')}>
                  <select id="set-lang" className={input} value={s.lang} onChange={(e) => set({ lang: e.target.value })}>
                    <option value="fr">{tr('Français')}</option>
                    <option value="en">{tr('English')}</option>
                  </select>
                </Field>
              </div>
            </Section>
          )}

          {section === 'livraison' && (
            <>
              <Section title={tr('Zones de livraison')} text={tr('Communes livrées, frais et délai annoncés au client.')}>
                <ul className="flex flex-col gap-3">
                  {s.zones.map((z, i) => (
                    <li key={z.id} className="grid grid-cols-[minmax(0,1.3fr)_100px_minmax(0,1.2fr)_150px] items-end gap-3 rounded-[10px] border border-d-line p-3.5 max-md:grid-cols-2">
                      <Field id={`zone-c-${z.id}`} label={tr('Commune')}>
                        <input id={`zone-c-${z.id}`} className={input} value={z.commune} onChange={(e) => setZone(z.id, { commune: e.target.value })} />
                      </Field>
                      <Field id={`zone-f-${z.id}`} label={tr('Frais ($)')}>
                        <input id={`zone-f-${z.id}`} type="number" min="0" className={`${input} font-mono`} value={z.fee} onChange={(e) => setZone(z.id, { fee: Number(e.target.value) })} />
                      </Field>
                      <Field id={`zone-d-${z.id}`} label={tr('Délai')}>
                        <input id={`zone-d-${z.id}`} className={input} value={z.delay} onChange={(e) => setZone(z.id, { delay: e.target.value })} />
                      </Field>
                      <div className="flex h-11 items-center gap-3">
                        <Toggle checked={z.active} onChange={(v) => setZone(z.id, { active: v })} label={<span className="text-[13px]">{z.active ? tr('Active') : tr('Inactive')}</span>} />
                        {i > 0 && (
                          <button type="button" onClick={() => set({ zones: s.zones.filter((x) => x.id !== z.id) })} aria-label={tr('Supprimer la zone {name}', { name: z.commune })} className="grid size-9 place-items-center rounded-lg text-d-muted hover:bg-d-soft hover:text-d-danger">
                            <Icon name="close" className="size-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <Button variant="soft" size="sm" className="mt-4" onClick={() => set({ zones: [...s.zones, { id: `z${Date.now()}`, commune: '', fee: 5, delay: 'Le lendemain', active: false }] })}>
                  <Icon name="plus" className="size-4" /> {tr('Ajouter une zone')}
                </Button>
              </Section>
              <Section title={tr('Horaires et retrait')}>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <Field id="set-cutoff" label={tr('Heure limite pour la livraison du jour')} hint={tr('Après cette heure, la commande est livrée le lendemain.')}>
                    <input id="set-cutoff" type="time" className={`${input} font-mono`} value={s.cutoff} onChange={(e) => set({ cutoff: e.target.value })} />
                  </Field>
                  <Field id="set-cancel" label={tr('Délai d’annulation par le client')} hint={tr('Tant que la commande n’est pas en préparation.')}>
                    <select id="set-cancel" className={input} value={s.cancelDelay} onChange={(e) => set({ cancelDelay: e.target.value })}>
                      <option value="5">{tr('5 minutes')}</option>
                      <option value="15">{tr('15 minutes')}</option>
                      <option value="30">{tr('30 minutes')}</option>
                    </select>
                  </Field>
                  <Field id="set-pickup" label={`${tr('Point de retrait')}${s.pickupBrand ? ` · ${BRANDS[s.pickupBrand]?.name ?? s.pickupBrand}` : ''}`} className="sm:col-span-2">
                    <input id="set-pickup" className={input} value={s.pickup} disabled={!s.pickupBrand} onChange={(e) => set({ pickup: e.target.value })} />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {section === 'paiements' && (
            <Section title={tr('Moyens de paiement')} text={tr('Tous les paiements se font en ligne, au moment de la commande.')}>
              <div className="divide-y divide-d-line">
                <Switch title={tr('Mobile money')} text={tr('Le client valide le paiement sur son téléphone.')} checked={s.mobileMoney} onChange={(v) => set({ mobileMoney: v })} />
                {s.mobileMoney && (
                  <div className="flex flex-wrap gap-2 py-3.5">
                    {Object.entries(s.operators).map(([op, on]) => (
                      <button
                        key={op}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set({ operators: { ...s.operators, [op]: !on } })}
                        className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13.5px] transition-colors ${on ? 'border-d-ink bg-d-ink text-white' : 'border-d-line bg-white text-d-muted'}`}
                      >
                        {on && <Icon name="check" className="size-3.5" />}
                        {op}
                      </button>
                    ))}
                  </div>
                )}
                <Switch title={tr('Carte bancaire')} text={tr('Visa, Mastercard. La carte est saisie chez le prestataire, jamais sur kclick.')} checked={s.card} onChange={(v) => set({ card: v })} />
                <Switch title={tr('Paiement à la livraison')} text={tr('Désactivé : tous les paiements se font en ligne.')} disabled />
              </div>
              <Field id="set-provider" label={tr('Prestataire de paiement')} hint={tr('À choisir : il confirmera automatiquement les paiements.')} className="mt-5 max-w-md">
                <input id="set-provider" className={input} value={s.provider} placeholder={tr('[à choisir]')} onChange={(e) => set({ provider: e.target.value })} />
              </Field>
            </Section>
          )}

          {section === 'notifications' && (
            <>
              <Section title={tr('E-mails au client')} text={tr('Envoyés à l’adresse saisie au moment de la commande.')}>
                <div className="divide-y divide-d-line">
                  {[
                    ['confirmation', 'Confirmation de commande', 'Numéro, articles, total.'],
                    ['prete', 'Commande prête', 'Pour un retrait en boutique.'],
                    ['route', 'Commande en route', 'Avec le nom du livreur et l’heure d’arrivée.'],
                    ['livree', 'Commande livrée', 'Avec un lien pour recommander.'],
                  ].map(([key, title, text]) => (
                    <Switch key={key} title={tr(title)} text={tr(text)} checked={s.clientMails[key]} onChange={(v) => set({ clientMails: { ...s.clientMails, [key]: v } })} />
                  ))}
                </div>
              </Section>
              <Section title={tr('E-mails à l’équipe')}>
                <p className="text-sm">{tr('Une alerte à chaque nouvelle commande')}</p>
                <p className="mt-0.5 text-xs text-d-muted">{tr('Détail de la commande et des Maisons concernées (au moins un destinataire).')}</p>
                <p className="mb-2 mt-4 text-[13px] text-d-muted">{tr('Destinataires')}</p>
                <ul className="flex flex-wrap gap-2">
                  {s.recipients.map((r) => (
                    <li key={r} className="inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-d-line bg-white pl-4 pr-1.5 text-[13.5px]">
                      <span className="truncate">{r}</span>
                      <button type="button" onClick={() => set({ recipients: s.recipients.filter((x) => x !== r) })} aria-label={tr('Retirer {email}', { email: r })} className="grid size-7 place-items-center rounded-full text-d-muted hover:bg-d-soft hover:text-d-danger">
                        <Icon name="close" className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-3 flex max-w-md gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const v = newRecipient.trim()
                    if (/^\S+@\S+\.\S+$/.test(v) && !s.recipients.includes(v)) {
                      set({ recipients: [...s.recipients, v] })
                      setNewRecipient('')
                    }
                  }}
                >
                  <label htmlFor="set-recipient" className="sr-only">{tr('Ajouter un destinataire')}</label>
                  <input id="set-recipient" type="email" className={input} placeholder="prenom@kennysinternational.com" value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} />
                  <Button type="submit" variant="soft" className="shrink-0">{tr('Ajouter')}</Button>
                </form>
              </Section>
              <Section title={tr('Dans les boutiques')}>
                <Switch title={tr('Son à chaque nouvelle commande')} text={tr('Joué sur l’écran « File des commandes » des employés.')} checked={s.sound} onChange={(v) => set({ sound: v })} />
              </Section>
            </>
          )}

          {section === 'maisons' && (
            <Section title={tr('Maisons')} text={tr('Une Maison fermée ne reçoit plus de commandes : ses produits restent visibles mais ne peuvent pas être commandés.')}>
              <ul className="divide-y divide-d-line">
                {Object.values(BRANDS).map((b) => (
                  <li key={b.id} className="grid grid-cols-[150px_minmax(0,1fr)_auto] items-center gap-4 py-4 max-sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Brand id={b.id} className="text-[15px]" />
                    <p className="text-[13.5px] text-d-muted max-sm:order-3 max-sm:col-span-2">{hoursText(s.hours[b.id])}</p>
                    <Toggle
                      checked={!!shopsOpen[b.id]}
                      onChange={() => dispatch({ type: 'shop/toggle', brand: b.id })}
                      label={<span className="w-[62px] text-[13px]">{shopsOpen[b.id] ? tr('Ouverte') : tr('Fermée')}</span>}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-d-muted">{tr('L’ouverture est appliquée tout de suite sur le site. Les horaires se règlent depuis l’espace de chaque Maison.')}</p>
            </Section>
          )}

          {section === 'securite' && (
            <>
              <Section title={tr('Connexion')} text={tr('L’équipe et les clients se connectent avec un code à 6 chiffres reçu par e-mail : aucun mot de passe à retenir ni à voler.')}>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <Field id="set-code" label={tr('Durée de validité du code')}>
                    <select id="set-code" className={input} value={s.codeValidity} onChange={(e) => set({ codeValidity: e.target.value })}>
                      <option value="5">{tr('5 minutes')}</option>
                      <option value="10">{tr('10 minutes')}</option>
                      <option value="15">{tr('15 minutes')}</option>
                    </select>
                  </Field>
                  <Field id="set-idle" label={tr('Déconnexion automatique de l’équipe')}>
                    <select id="set-idle" className={input} value={s.idle} onChange={(e) => set({ idle: e.target.value })}>
                      <option value="30">{tr('Après 30 min d’inactivité')}</option>
                      <option value="60">{tr('Après 1 h d’inactivité')}</option>
                      <option value="480">{tr('Après 8 h (une journée)')}</option>
                      <option value="1440">{tr('Après 24 h')}</option>
                    </select>
                  </Field>
                </div>
              </Section>
              <Section title={tr('Sessions ouvertes')} text={tr('Pour retirer l’accès à une personne (téléphone perdu, départ), désactivez son compte dans Utilisateurs et rôles : elle ne peut plus se connecter.')}>
                <a href="#admin/utilisateurs" className="text-[13px] underline decoration-d-border underline-offset-4">{tr('Ouvrir Utilisateurs et rôles')}</a>
              </Section>
            </>
          )}

        </div>
      </div>

      {/* Téléphone : bouton d'enregistrement toujours visible en bas */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-d-line bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
          <Button onClick={save} disabled={saving} className="w-full">{saving ? tr('Enregistrement…') : tr('Enregistrer les modifications')}</Button>
        </div>
      )}
    </>
  )
}
