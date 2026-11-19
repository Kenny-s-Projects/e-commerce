/* eslint-disable react-refresh/only-export-components -- composants et petites fonctions liées, gardés ensemble */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from '../ui/Icon.jsx'
import { Avatar } from '../ui/ui.jsx'
import { ME } from '../data/demo.js'
import { useStore } from '../store/store.jsx'
import { canDispatch, isOpen } from '../lib/status.js'

export const ADMIN_MENU = [
  { id: 'vue', label: 'Vue d’ensemble', icon: 'home', href: '#admin' },
  { id: 'commandes', label: 'Commandes', icon: 'list', href: '#admin/commandes', badge: 'open' },
  { id: 'dispatch', label: 'Dispatch', icon: 'dispatch', href: '#admin/dispatch', badge: 'dispatch' },
  { id: 'livreurs', label: 'Livreurs', icon: 'bike', href: '#admin/livreurs' },
  { id: 'catalogue', label: 'Catalogue', icon: 'tag', href: '#admin/catalogue' },
  { id: 'maisons', label: 'Maisons', icon: 'store', href: '#admin/maisons' },
  { id: 'utilisateurs', label: 'Utilisateurs et rôles', icon: 'users', href: '#admin/utilisateurs' },
  { id: 'clients', label: 'Clients', icon: 'user', href: '#admin/clients' },
  { id: 'paiements', label: 'Paiements', icon: 'card', href: '#admin/paiements' },
  { id: 'rapports', label: 'Rapports', icon: 'chart', href: '#admin/rapports' },
  { id: 'parametres', label: 'Paramètres', icon: 'settings', href: '#admin/parametres' },
]

function Logo() {
  return (
    <a href="#admin" className="flex items-baseline gap-3 text-white">
      <span className="text-[22px] font-normal tracking-[-0.01em]">kclick</span>
      <span className="caps text-[9.5px] text-d-gold">Dashboard</span>
    </a>
  )
}

function Nav({ current, onNavigate }) {
  const { orders } = useStore()
  const badges = {
    open: orders.filter(isOpen).length,
    dispatch: orders.filter(canDispatch).length,
  }
  return (
    <nav aria-label="Menu du dashboard" className="flex flex-col gap-1">
      {ADMIN_MENU.map((item) => {
        const active = current === item.id
        const count = item.badge ? badges[item.badge] : 0
        return (
          <a
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex h-10 items-center gap-3.5 rounded-lg px-3 text-[14.5px] transition-colors duration-200 ${
              active ? 'bg-[#2a2622] text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon name={item.icon} className="size-[17px] opacity-90" />
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span className="grid h-[19px] min-w-[34px] place-items-center rounded-full bg-d-gold px-2 font-mono text-[11px] font-medium text-d-ink">
                {count}
              </span>
            )}
          </a>
        )
      })}
    </nav>
  )
}

function Me() {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 pt-4">
      <Avatar name={ME.name} className="size-9 text-[12px]" tone="bg-d-gold text-d-ink" />
      <div className="flex-1 leading-tight">
        <p className="text-[14.5px] text-white">{ME.name}</p>
        <p className="text-xs text-white/60">{ME.role}</p>
      </div>
      <a href="#connexion" aria-label="Se déconnecter" title="Se déconnecter" className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/5 hover:text-white">
        <Icon name="logout" className="size-[18px]" />
      </a>
    </div>
  )
}

/**
 * Mise en page super-admin : menu latéral noir (ordinateur),
 * barre du haut + menu dépliant (tablette et téléphone).
 */
export default function AdminLayout({ current, children }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="min-h-svh bg-d-bg font-sans text-d-ink antialiased">
      {/* Ordinateur */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col justify-between bg-d-ink px-4 pb-5 pt-7 max-lg:hidden">
        <div className="flex flex-col gap-8">
          <div className="px-2.5">
            <Logo />
          </div>
          <Nav current={current} />
        </div>
        <Me />
      </aside>

      {/* Tablette et téléphone */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-d-ink px-4 lg:hidden">
        <Logo />
        <button type="button" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="grid size-10 place-items-center text-white">
          <Icon name="menu" className="size-6" />
        </button>
      </header>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.button
              type="button"
              aria-label="Fermer le menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col justify-between overflow-y-auto bg-d-ink px-4 pb-5 pt-5"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-2.5">
                  <Logo />
                  <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu" className="grid size-10 place-items-center text-white">
                    <Icon name="close" className="size-5" />
                  </button>
                </div>
                <Nav current={current} onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-6">
                <Me />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="px-[clamp(16px,3vw,40px)] pb-16 pt-[clamp(20px,3vw,36px)] lg:pl-[calc(248px+clamp(16px,3vw,40px))]">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  )
}
