import { BRANDS, STAFF } from '../data/demo.js'
import { useStore } from '../store/store.jsx'
import { Avatar, Toggle } from '../ui/ui.jsx'

const TABS = [
  { id: 'file', label: 'File des commandes', badge: true },
  { id: 'retraits', label: 'Retraits' },
  { id: 'disponibilites', label: 'Disponibilités' },
]

/**
 * Mise en page employé d'une Maison : barre noire en haut (onglets, boutique ouverte, compte).
 * Sur téléphone, les onglets passent sur une seconde ligne qui défile.
 */
export default function EmployeLayout({ brand, current, children }) {
  const { orders, shopsOpen, dispatch } = useStore()
  const b = BRANDS[brand]
  const fresh = orders.filter((o) => !o.cancelled && o.parts.some((p) => p.brand === brand && p.status === 'nouvelle')).length

  const tabs = TABS.map((t) => {
    const active = current === t.id
    return (
      <a
        key={t.id}
        href={`#employe/${brand}${t.id === 'file' ? '' : `/${t.id}`}`}
        aria-current={active ? 'page' : undefined}
        className={`relative flex h-full shrink-0 items-center gap-2.5 px-3.5 text-[14.5px] transition-colors ${active ? 'text-white' : 'text-white/70 hover:text-white'}`}
      >
        {t.label}
        {t.badge && fresh > 0 && (
          <span className="grid h-[19px] min-w-[30px] place-items-center rounded-full bg-d-gold px-2 font-mono text-[11px] font-medium text-d-ink">{fresh}</span>
        )}
        {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-d-gold" aria-hidden />}
      </a>
    )
  })

  return (
    <div className="min-h-svh bg-d-bg font-sans text-d-ink antialiased">
      <header className="sticky top-0 z-30 bg-d-ink text-white">
        <div className="flex h-16 items-center justify-between gap-4 px-[clamp(16px,3vw,40px)]">
          <div className="flex h-full items-center gap-[clamp(16px,3vw,40px)]">
            <a href={`#employe/${brand}`} className="flex items-center gap-3">
              <span className="text-[21px]">kclick</span>
              <span className="flex items-center gap-2 text-sm text-white/85">
                <span className="size-2.5 rounded-full" style={{ background: b.color }} aria-hidden />
                {b.name} · Gombe
              </span>
            </a>
            <nav aria-label="Espace boutique" className="flex h-full max-md:hidden">
              {tabs}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-white/15 px-3 py-1.5 max-sm:border-0 max-sm:px-0">
              <Toggle
                checked={shopsOpen[brand]}
                onChange={() => dispatch({ type: 'shop/toggle', brand })}
                label={<span className="max-sm:sr-only">{shopsOpen[brand] ? 'Boutique ouverte' : 'Boutique fermée'}</span>}
              />
            </div>
            <span className="flex items-center gap-2.5">
              <Avatar name={STAFF[brand]} className="size-8 text-[12px]" tone="text-white" color={b.color} />
              <span className="text-sm max-sm:hidden">{STAFF[brand]}</span>
            </span>
          </div>
        </div>
        <nav aria-label="Espace boutique" className="flex h-12 overflow-x-auto border-t border-white/10 px-2 md:hidden">
          {tabs}
        </nav>
      </header>
      <main className="px-[clamp(16px,3vw,40px)] pb-16 pt-[clamp(20px,3vw,36px)]">
        <div className="mx-auto max-w-[1360px]">{children}</div>
      </main>
    </div>
  )
}
