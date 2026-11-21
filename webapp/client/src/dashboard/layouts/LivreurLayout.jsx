import Icon from '../ui/Icon.jsx'
import { tr } from '../lib/i18n.js'

const TABS = [
  { id: 'courses', label: 'Courses', icon: 'bike', href: '#livreur' },
  { id: 'historique', label: 'Historique', icon: 'history', href: '#livreur/historique' },
  { id: 'profil', label: 'Profil', icon: 'user', href: '#livreur/profil' },
]

/**
 * Mise en page livreur : pensée pour le téléphone (barre d'onglets en bas).
 * Sur ordinateur, la colonne reste étroite et centrée, comme une application.
 *  tabs = false : écran plein (une course), avec sa propre barre d'action en bas
 */
export default function LivreurLayout({ current, tabs = true, children }) {
  return (
    <div className="min-h-svh bg-[#e9e5dc] font-sans text-d-ink antialiased">
      <div className="relative mx-auto flex min-h-svh max-w-[480px] flex-col bg-d-bg md:my-6 md:min-h-[calc(100svh-48px)] md:overflow-hidden md:rounded-[28px] md:shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <div className={`flex-1 ${tabs ? 'pb-24' : ''}`}>{children}</div>
        {tabs && (
          <nav
            aria-label={tr('Espace livreur')}
            className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-[480px] grid-cols-3 border-t border-d-line bg-white pb-[env(safe-area-inset-bottom)] md:absolute"
          >
            {TABS.map((t) => {
              const active = current === t.id
              return (
                <a
                  key={t.id}
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-[12px] ${active ? 'text-d-ink' : 'text-d-muted'}`}
                >
                  <Icon name={t.icon} className="size-[21px]" strokeWidth={active ? 1.8 : 1.5} />
                  {tr(t.label)}
                </a>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
