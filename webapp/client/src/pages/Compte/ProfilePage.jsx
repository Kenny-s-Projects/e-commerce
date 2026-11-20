/* eslint-disable react-refresh/only-export-components -- composants et petites fonctions liées, gardés ensemble */
import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { useLang, useT } from '../../i18n/lang.js'
import { addresses as demoAddresses, favorites, STATUS } from '../../data/account.js'
import { getProduct, productGallery } from '../../data/products.js'
import { formatPrice } from '../../data/houses.js'
import { useLive } from '../../data/live.js'
import { api } from '../../lib/api.js'
import { signOut } from '../../lib/supabase.js'
import { Houses, StatusPill, ease, fadeUp, inputClass, underline } from './accountUi.jsx'

export const PROFILE_TABS = [
  { id: 'commandes', label: 'Commandes' },
  { id: 'adresses', label: 'Adresses' },
  { id: 'favoris', label: 'Favoris' },
  { id: 'infos', label: 'Mes infos' },
]

/** Mon compte (#compte/profil/<onglet>) : commandes, adresses, favoris, informations */
export default function ProfilePage({ tab = 'commandes' }) {
  const t = useT()
  const [me, setMe] = useState(null)
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)

  // Profil et commandes réels (API) ; sans session : retour à la connexion
  useEffect(() => {
    let alive = true
    Promise.all([api.get('/users/me'), api.get('/orders/mine')])
      .then(([m, o]) => {
        if (!alive) return
        setMe(m)
        setOrders(o)
      })
      .catch((err) => {
        if (!alive) return
        if (err.status === 401) window.location.hash = 'compte'
        else setError(err)
      })
    return () => {
      alive = false
    }
  }, [])

  if (!me) {
    return (
      <div className="grid min-h-[60svh] place-items-center bg-white px-gutter text-center text-ink">
        {error ? (
          <div>
            <p className="text-[17px]">{t('Votre compte ne répond pas pour le moment.')}</p>
            <p className="mt-2 text-[13px] text-ink/60">{t(error.message)}</p>
          </div>
        ) : (
          <p className="text-[15px] text-ink/60">{t('Chargement de votre compte…')}</p>
        )}
      </div>
    )
  }

  const [firstName, ...rest] = (me.fullName || me.email || '').split(/\s+/)
  const lastName = rest.join(' ')
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '·'

  return (
    <div className="min-h-[calc(100svh-4rem)] bg-white text-ink">
      <header className="bg-[#f2efe8]">
        <m.div className="mx-auto flex max-w-[1100px] items-center gap-5 px-gutter pb-6 pt-[clamp(28px,4vw,56px)]" {...fadeUp()}>
          <span className="grid size-[56px] shrink-0 place-items-center rounded-full bg-ink text-[17px] text-white md:size-[72px] md:text-[20px]" aria-hidden>
            {initials}
          </span>
          <div>
            <p className="caps text-[#86671f]">{t('Mon compte')}</p>
            <h1 className="mt-1.5 text-[clamp(26px,3vw,40px)] font-light leading-tight">
              {firstName} <span className="accent">{lastName}</span>
            </h1>
          </div>
        </m.div>
        <nav aria-label={t('Mon compte')} className="mx-auto flex max-w-[1100px] overflow-x-auto px-gutter max-sm:px-2">
          {PROFILE_TABS.map((tb) => {
            const on = tb.id === tab
            return (
              <a
                key={tb.id}
                href={`#compte/profil/${tb.id}`}
                aria-current={on ? 'page' : undefined}
                className={`relative shrink-0 px-[14px] pb-3.5 pt-2 text-[15px] transition-colors ${on ? 'text-ink' : 'text-ink/60 hover:text-ink'}`}
              >
                {t(tb.label)}
                {on && <m.span layoutId="profile-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" transition={{ duration: 0.4, ease }} />}
              </a>
            )
          })}
        </nav>
      </header>

      <div className="mx-auto max-w-[1100px] px-gutter py-[clamp(22px,3vw,48px)] max-sm:px-[22px]">
        <AnimatePresence mode="wait">
          <m.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }}>
            {tab === 'adresses' ? <Addresses /> : tab === 'favoris' ? <Favorites /> : tab === 'infos' ? <Infos me={me} /> : <Orders orders={orders ?? []} />}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

const OPEN = ['en_attente', 'en_cours', 'prete_retrait', 'en_livraison']
const DONE_LABEL = { livree: 'Livrée le {d}', retiree: 'Retirée le {d}', annulee: 'Annulée le {d}', refusee: 'Refusée le {d}' }
const day = (iso, lang) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long' })
const brandSlugs = (brands) => (brands ?? '').split(',').map((b) => b.trim().toLowerCase()).filter(Boolean)

function Orders({ orders }) {
  const t = useT()
  const { lang } = useLang()
  const current = orders.filter((o) => OPEN.includes(o.status))
  const past = orders.filter((o) => !OPEN.includes(o.status))

  if (!orders.length) {
    return (
      <div className="py-10 text-center">
        <p className="text-[17px]">{t('Aucune commande pour l’instant.')}</p>
        <a href="#maison/patchi" className={`caps mt-5 inline-block text-[11px] ${underline}`}>{t('Découvrir Patchi')}</a>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      <section aria-labelledby="current-order">
        <h2 id="current-order" className="mb-4 text-[14px] font-medium text-ink/70">
          {t('En cours')}
        </h2>
        {current.length === 0 && <p className="text-[14px] text-ink/60">{t('Aucune commande en cours.')}</p>}
        <div className="flex flex-col gap-4">
          {current.map((o) => (
            <article key={o.id} className="border-[1.5px] border-kyra p-[18px] md:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[15px] md:text-[17px]">{o.number}</span>
                <StatusPill status={STATUS[o.status] ?? STATUS.en_attente} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[14px]">
                <Houses houses={brandSlugs(o.brands)} />
                <span className="font-mono text-[15px]">{formatPrice(o.adjusted_total ?? o.total)}</span>
              </div>
              <a href={`#suivi/${o.number}`} className={`caps mt-5 inline-block text-[11px] ${underline}`}>
                {t('Suivre ma commande')}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="past-orders">
        <h2 id="past-orders" className="text-[14px] font-medium text-ink/70">
          {t('Commandes passées')}
        </h2>
        {past.length === 0 && <p className="mt-3 text-[14px] text-ink/60">{t('Pas encore de commande terminée.')}</p>}
        <ul className="mt-2">
          {past.map((o) => (
            <li key={o.id} className="flex items-center gap-4 border-b border-[#e6e1d6] py-5">
              <div className="min-w-0 flex-1">
                <a href={`#suivi/${o.number}`} className="font-mono text-[15px] hover:underline">{o.number}</a>
                <p className="mt-1 text-[13px] text-ink/60">
                  {t(DONE_LABEL[o.status] ?? 'Commandée le {d}', { d: day(o.created_at, lang) })} · {o.brands}
                </p>
              </div>
              <span className="font-mono text-[15px]">{formatPrice(o.adjusted_total ?? o.total)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Addresses() {
  const t = useT()
  const [list, setList] = useState(demoAddresses)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ label: '', street: '', landmark: '' })
  const [error, setError] = useState(false)

  const save = (e) => {
    e.preventDefault()
    if (!form.street.trim()) return setError(true)
    setList((l) => [...l, { id: `a${l.length + 1}`, label: form.label.trim() || t('Adresse'), commune: 'Gombe', street: form.street.trim(), landmark: form.landmark.trim(), isDefault: false }])
    setForm({ label: '', street: '', landmark: '' })
    setAdding(false)
    setError(false)
  }

  return (
    <div>
      <p className="mb-5 text-[13px] text-ink/60">{t('Bientôt : vos adresses seront enregistrées avec votre compte. En attente, elles restent sur cet appareil.')}</p>
      <ul className="grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 border border-[#e6e1d6] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-medium">{t(a.label)}</p>
              {a.isDefault && <span className="caps text-[9px] text-[#86671f]">{t('Par défaut')}</span>}
            </div>
            <p className="text-[14px] leading-[1.6] text-ink/75">
              {a.commune}, {a.street}
              {a.landmark && (
                <>
                  <br />
                  {t('Repère')} : {a.landmark}
                </>
              )}
            </p>
          </li>
        ))}
      </ul>

      {adding ? (
        <form onSubmit={save} noValidate className="mt-6 grid max-w-[560px] gap-4 border border-ink p-5">
          <p className="text-[15px] font-medium">{t('Nouvelle adresse')}</p>
          <input aria-label={t('Nom de l’adresse (Maison, Bureau…)')} placeholder={t('Nom de l’adresse (Maison, Bureau…)')} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className={inputClass(false)} />
          <div>
            <input
              aria-label={t('Rue et numéro, à Gombe')}
              placeholder={t('Rue et numéro, à Gombe')}
              value={form.street}
              onChange={(e) => {
                setForm((f) => ({ ...f, street: e.target.value }))
                setError(false)
              }}
              aria-invalid={error || undefined}
              className={inputClass(error)}
            />
            {error && <p className="mt-2 text-[12px] text-celio">{t('Indiquez la rue.')}</p>}
          </div>
          <input aria-label={t('Point de repère pour le livreur')} placeholder={t('Point de repère pour le livreur')} value={form.landmark} onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))} className={inputClass(false)} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="caps h-12 flex-1 bg-ink px-6 text-[11px] text-white">
              {t('Enregistrer')}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="caps h-12 border border-ink px-6 text-[11px]">
              {t('Annuler')}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="caps mt-6 h-12 border border-ink px-6 text-[11px] transition-colors hover:bg-ink hover:text-white">
          + {t('Ajouter une adresse')}
        </button>
      )}
    </div>
  )
}

function Favorites() {
  const t = useT()
  useLive()
  const products = favorites.map(getProduct).filter(Boolean)
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <a href={`#produit/${p.id}`} className="group block">
            <span className="block aspect-[4/5] overflow-hidden bg-kyra-card">
              <img src={productGallery(p)[0]} alt={t(p.name)} loading="lazy" decoding="async" className="size-full object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-lux group-hover:scale-[1.04]" />
            </span>
            <span className="caps mt-3 block text-[9px] text-ink/55">{p.house?.name}{p.store ? ` · ${t(p.store)}` : ''}</span>
            <span className="mt-1 block text-[14px] leading-snug">{t(p.name)}</span>
            <span className="mt-1 block font-mono text-[13px]">{p.live ? `${p.byWeight ? `${t('dès')} ` : ''}${formatPrice(p.price)}` : t('Bientôt disponible')}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function Infos({ me }) {
  const t = useT()
  const rows = [
    ['Nom', me.fullName || '—'],
    ['Adresse e-mail', me.email || '—'],
    ['Téléphone (WhatsApp)', me.phone || '—'],
    ['Langue', me.lang === 'en' ? 'English' : 'Français'],
  ]
  const logout = async () => {
    await signOut()
    window.location.hash = 'compte'
  }
  return (
    <div className="max-w-[640px]">
      <dl className="divide-y divide-[#e6e1d6] border-y border-[#e6e1d6]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-4 text-[14px]">
            <dt className="text-ink/60">{t(k)}</dt>
            <dd className="break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[13px] text-ink/60">{t('Pour modifier vos informations, écrivez à la conciergerie.')}</p>
      <button type="button" onClick={logout} className="caps mt-8 inline-grid h-12 place-items-center border border-ink px-6 text-[11px] transition-colors hover:bg-ink hover:text-white">
        {t('Se déconnecter')}
      </button>
    </div>
  )
}
