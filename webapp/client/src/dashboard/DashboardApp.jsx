import { useEffect } from 'react'
import { DashboardStore, canEnter, useStore } from './store/store.jsx'
import { useDashRoute } from './lib/route.js'
import AdminLayout from './layouts/AdminLayout.jsx'
import EmployeLayout from './layouts/EmployeLayout.jsx'
import LivreurLayout from './layouts/LivreurLayout.jsx'
import Overview from './admin/Overview.jsx'
import Orders from './admin/Orders.jsx'
import OrderDetail from './admin/OrderDetail.jsx'
import Dispatch from './admin/Dispatch.jsx'
import ComingSoon from './admin/ComingSoon.jsx'
import Settings from './admin/Settings.jsx'
import Clients from './admin/Clients.jsx'
import ClientDetail from './admin/ClientDetail.jsx'
import Users from './admin/Users.jsx'
import UserForm from './admin/UserForm.jsx'
import StaffLogin from './auth/StaffLogin.jsx'
import Queue from './employe/Queue.jsx'
import Pickups from './employe/Pickups.jsx'
import Availability from './employe/Availability.jsx'
import Courses from './livreur/Courses.jsx'
import Course from './livreur/Course.jsx'
import RiderHistory from './livreur/RiderHistory.jsx'
import RiderProfile from './livreur/RiderProfile.jsx'
import { BRANDS } from './data/demo.js'
import { DashLangContext, tr, useDashLang, useDashboardLang } from './lib/i18n.js'

/*
 * Dashboards kclick : super-admin, employé d'une Maison, livreur.
 * Données de l'API Express (store/store.jsx) ; connexion par code e-mail (Supabase Auth).
 */
export default function DashboardApp() {
  const route = useDashRoute()
  // Langue FR / EN : gardée ici, un changement redessine tout le dashboard (voir lib/i18n.js)
  const lang = useDashboardLang()

  useEffect(() => {
    const titles = { admin: 'Super admin', employe: 'Boutique', livreur: 'Livreur', dashboard: 'Dashboard', connexion: 'Connexion' }
    document.title = `kclick · ${tr(titles[route.space])}`
  }, [route.space, lang.effective])

  return (
    <DashLangContext.Provider value={lang}>
      <DashboardStore key={`${route.space}-${route.brand ?? ''}`} space={route.space} brand={route.brand}>
        <ProfileLang />
        <Guard route={route}>
          <Screens route={route} />
        </Guard>
        <Toast />
      </DashboardStore>
    </DashLangContext.Provider>
  )
}

/** Sans préférence choisie, le dashboard prend la langue du profil de la personne connectée */
function ProfileLang() {
  const { me } = useStore()
  const { adoptProfileLang } = useDashLang()
  useEffect(() => {
    if (me?.lang) adoptProfileLang(me.lang)
  }, [me?.lang, adoptProfileLang])
  return null
}

/**
 * Accès : sans session → connexion ; mauvais rôle → page d'arrivée du compte.
 * La page de connexion reste toujours accessible ; le choix des espaces n'existe qu'en développement.
 */
function Guard({ route, children }) {
  const { auth, me, notify } = useStore()
  const protectedSpace = ['admin', 'employe', 'livreur'].includes(route.space)
  const allowed = !protectedSpace || canEnter(me, route.space, route.brand)

  useEffect(() => {
    if (route.space === 'dashboard' && !import.meta.env.DEV) window.location.hash = 'connexion'
    if (!protectedSpace || auth.status === 'loading' || auth.status === 'error') return
    if (auth.status === 'anon') window.location.hash = 'connexion'
    else if (!allowed) {
      notify(tr('Cet espace n’est pas accessible avec votre compte.'))
      window.location.hash = (me?.home ?? '#connexion').replace(/^#/, '')
    }
  }, [route.space, protectedSpace, auth.status, allowed, me, notify])

  if (protectedSpace && auth.status === 'error')
    return (
      <Centered>
        <p className="text-[17px]">{tr('Le serveur ne répond pas.')}</p>
        <p className="mt-2 max-w-sm text-sm text-d-muted">{tr(auth.error)} {tr('Réessayez dans un instant.')}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-5 h-11 rounded-lg bg-d-ink px-5 text-sm text-white">
          {tr('Réessayer')}
        </button>
      </Centered>
    )
  if (protectedSpace && (auth.status !== 'ok' || !allowed)) return <Centered><p className="text-sm text-d-muted">{tr('Chargement…')}</p></Centered>
  return children
}

const Centered = ({ children }) => (
  <div className="grid min-h-svh place-items-center bg-d-bg px-6 text-center font-sans text-d-ink">
    <div className="flex flex-col items-center">{children}</div>
  </div>
)

/** Bandeau de message (erreur de l'API, confirmation) */
function Toast() {
  const { toast, dismissToast } = useStore()
  if (!toast) return null
  const error = toast.kind === 'error'
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div
        key={toast.id}
        role={error ? 'alert' : 'status'}
        className={`pointer-events-auto flex max-w-[560px] animate-[slidein_.35s_ease] items-start gap-3 rounded-[12px] px-4 py-3 text-sm shadow-lg ${
          error ? 'bg-[#f7deda] text-[#8e2118]' : 'bg-d-ink text-white'
        }`}
      >
        <span className="flex-1 leading-relaxed">{toast.text}</span>
        <button type="button" onClick={dismissToast} aria-label={tr('Fermer le message')} className="shrink-0 opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  )
}

function Screens({ route }) {
  return (
    <>
      {route.space === 'admin' ? (
        <AdminLayout current={route.section === 'commande' ? 'commandes' : route.section}>
          {route.section === 'vue' ? (
            <Overview />
          ) : route.section === 'commandes' && route.id ? (
            <OrderDetail number={route.id} />
          ) : route.section === 'commandes' ? (
            <Orders />
          ) : route.section === 'dispatch' ? (
            <Dispatch />
          ) : route.section === 'parametres' ? (
            <Settings />
          ) : route.section === 'clients' && route.id ? (
            <ClientDetail id={route.id} />
          ) : route.section === 'clients' ? (
            <Clients />
          ) : route.section === 'utilisateurs' && route.id ? (
            <UserForm id={route.id === 'nouveau' ? null : route.id} />
          ) : route.section === 'utilisateurs' ? (
            <Users />
          ) : (
            <ComingSoon section={route.section} />
          )}
        </AdminLayout>
      ) : route.space === 'employe' ? (
        <EmployeLayout brand={route.brand} current={route.section}>
          {route.section === 'retraits' ? (
            <Pickups brand={route.brand} />
          ) : route.section === 'disponibilites' ? (
            <Availability brand={route.brand} />
          ) : (
            <Queue brand={route.brand} />
          )}
        </EmployeLayout>
      ) : route.space === 'livreur' ? (
        route.section === 'course' && route.id ? (
          <LivreurLayout tabs={false}>
            <Course number={route.id} />
          </LivreurLayout>
        ) : (
          <LivreurLayout current={route.section}>
            {route.section === 'historique' ? <RiderHistory /> : route.section === 'profil' ? <RiderProfile /> : <Courses />}
          </LivreurLayout>
        )
      ) : route.space === 'connexion' ? (
        <StaffLogin step={route.section} />
      ) : import.meta.env.DEV ? (
        <Spaces />
      ) : null}
    </>
  )
}

// Choix de l'espace (développement uniquement)
function Spaces() {
  const spaces = [
    { href: '#connexion', title: 'Connexion de l’équipe', text: 'Écran de connexion par code e-mail (admin, employés, livreurs).' },
    { href: '#admin', title: 'Super admin', text: 'Vue d’ensemble, commandes, dispatch des livreurs.' },
    ...Object.values(BRANDS).map((b) => ({ href: `#employe/${b.id}`, title: `${tr('Employé')} · ${b.name}`, text: 'File des commandes de la Maison.', color: b.color })),
    { href: '#livreur', title: 'Livreur', text: 'Courses du jour, récupération et remise (pensé pour le téléphone).' },
  ]
  return (
    <div className="min-h-svh bg-d-bg px-[clamp(16px,4vw,48px)] py-[clamp(32px,6vw,72px)] font-sans text-d-ink">
      <div className="mx-auto max-w-[880px]">
        <p className="caps text-d-gold-ink">kclick · Dashboard</p>
        <h1 className="mt-3 text-[clamp(32px,4vw,44px)] font-light leading-tight">
          {tr('Choisir un')} <span className="font-serif italic">{tr('espace')}</span>
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-d-muted">{tr('Développement : chaque espace demande un compte avec le bon rôle.')}</p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {spaces.map((s) => (
            <li key={s.href}>
              <a href={s.href} className="flex h-full flex-col gap-1.5 rounded-[14px] border border-d-line bg-white p-5 transition-colors hover:border-d-ink">
                <span className="flex items-center gap-2.5 text-[17px]">
                  {s.color && <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />}
                  {tr(s.title)}
                </span>
                <span className="text-sm text-d-muted">{tr(s.text)}</span>
              </a>
            </li>
          ))}
        </ul>
        <a href="#" className="mt-10 inline-block text-[13px] underline decoration-d-border underline-offset-4">{tr('Retour au site')}</a>
      </div>
    </div>
  )
}
