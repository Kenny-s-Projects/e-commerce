import { useEffect } from 'react'
import { DashboardStore } from './store/store.jsx'
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

/*
 * Dashboards kclick : super-admin, employé d'une Maison, livreur.
 * Données de démonstration pour l'instant (store/store.jsx), à brancher sur l'API Express.
 */
export default function DashboardApp() {
  const route = useDashRoute()

  useEffect(() => {
    const titles = { admin: 'Super admin', employe: 'Boutique', livreur: 'Livreur', dashboard: 'Dashboard', connexion: 'Connexion' }
    document.title = `kclick · ${titles[route.space]}`
  }, [route.space])

  return (
    <DashboardStore>
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
      ) : (
        <Spaces />
      )}
    </DashboardStore>
  )
}

// Choix de l'espace (démonstration, en attendant la connexion avec les rôles)
function Spaces() {
  const spaces = [
    { href: '#connexion', title: 'Connexion de l’équipe', text: 'Écran de connexion par code e-mail (admin, employés, livreurs).' },
    { href: '#admin', title: 'Super admin', text: 'Vue d’ensemble, commandes, dispatch des livreurs.' },
    ...Object.values(BRANDS).map((b) => ({ href: `#employe/${b.id}`, title: `Employé · ${b.name}`, text: 'File des commandes de la Maison.', color: b.color })),
    { href: '#livreur', title: 'Livreur', text: 'Courses du jour, récupération et remise (pensé pour le téléphone).' },
  ]
  return (
    <div className="min-h-svh bg-d-bg px-[clamp(16px,4vw,48px)] py-[clamp(32px,6vw,72px)] font-sans text-d-ink">
      <div className="mx-auto max-w-[880px]">
        <p className="caps text-d-gold-ink">kclick · Dashboard</p>
        <h1 className="mt-3 text-[clamp(32px,4vw,44px)] font-light leading-tight">
          Choisir un <span className="font-serif italic">espace</span>
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-d-muted">Démonstration : chaque espace s’ouvrira selon le rôle du compte une fois la connexion branchée.</p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {spaces.map((s) => (
            <li key={s.href}>
              <a href={s.href} className="flex h-full flex-col gap-1.5 rounded-[14px] border border-d-line bg-white p-5 transition-colors hover:border-d-ink">
                <span className="flex items-center gap-2.5 text-[17px]">
                  {s.color && <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />}
                  {s.title}
                </span>
                <span className="text-sm text-d-muted">{s.text}</span>
              </a>
            </li>
          ))}
        </ul>
        <a href="#" className="mt-10 inline-block text-[13px] underline decoration-d-border underline-offset-4">Retour au site</a>
      </div>
    </div>
  )
}
