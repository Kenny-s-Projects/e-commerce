import { useState } from 'react'
import { useT } from '../../i18n/lang.js'

/**
 * Contenu de la barre de filtres des pages Maison.
 *  - Ordinateur : les pastilles, le nombre de produits et le tri sur une ligne (comme avant).
 *  - Mobile : un bouton « Filtres » (avec le nombre de filtres actifs), le nombre de produits et le tri ;
 *    un clic déplie un panneau avec toutes les pastilles, « Effacer » et « Voir les produits ».
 *  children    : les groupes de pastilles
 *  activeCount : nombre de filtres actifs
 *  total       : nombre de produits affichés
 *  sort        : le menu de tri (facultatif)
 *  onClear     : efface tous les filtres
 *  round       : pastilles arrondies (Patchi)
 */
export default function FilterPanel({ children, activeCount = 0, total, sort = null, onClear, round = false, id = 'filtres' }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const radius = round ? 'rounded-full' : ''
  const count = (
    <span className="text-[12px] opacity-80">
      {t(total > 1 ? '{n} produits' : '{n} produit', { n: total })}
    </span>
  )

  return (
    <div className="px-gutter py-3.5">
      {/* Mobile : bouton Filtres + nombre + tri */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className={`flex h-9 items-center gap-2 border border-current/30 px-4 text-[12px] ${radius}`}
        >
          <FilterIcon />
          {t('Filtres')}
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-(--fg) text-[10px] text-(--card)">{activeCount}</span>
          )}
          <span aria-hidden className={`ml-1 text-[10px] transition-transform duration-500 ease-lux ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {count}
        {sort}
      </div>

      {/* Les pastilles : toujours visibles sur ordinateur, dépliables sur mobile */}
      <div
        id={id}
        className={`grid transition-[grid-template-rows] duration-500 ease-lux md:grid-rows-[1fr] ${open ? 'max-md:grid-rows-[1fr]' : 'max-md:grid-rows-[0fr]'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 max-md:flex-col max-md:items-stretch max-md:gap-y-5 max-md:pb-1 max-md:pt-4">
            {children}

            {/* Ordinateur : nombre + tri à droite */}
            <span className="ml-auto max-md:hidden">{count}</span>
            {sort && <span className="max-md:hidden">{sort}</span>}

            {/* Mobile : actions du panneau */}
            <div className="flex items-center justify-between gap-3 border-t border-current/15 pt-4 md:hidden">
              <button
                type="button"
                onClick={onClear}
                disabled={activeCount === 0}
                className="text-[12px] underline underline-offset-4 disabled:no-underline disabled:opacity-40"
              >
                {t('Effacer')}
              </button>
              <button type="button" onClick={() => setOpen(false)} className={`h-10 bg-(--fg) px-5 text-[12px] text-(--card) ${radius}`}>
                {t(total > 1 ? 'Voir {n} produits' : 'Voir {n} produit', { n: total })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="size-4" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  )
}
