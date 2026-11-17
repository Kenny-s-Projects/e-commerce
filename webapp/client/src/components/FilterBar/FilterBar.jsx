import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SORTS } from '../../data/sorts.js'


/**
 * Barre de filtres collée sous le header : pastilles de collection, nombre de produits, tri.
 *  options  : [{ id, label }] (la pastille « Tout » est ajoutée automatiquement)
 *  active   : id filtré ('all' = tout)
 *  count    : nombre de produits affichés
 *  sort     : id du tri ; onSort(id)
 *  pillClass: couleurs de la pastille active (ex. 'bg-ink text-cream')
 *  pageClass: fond de la barre (même que la page)
 */
const FilterBar = forwardRef(function FilterBar(
  { options, active, onChange, count, sort, onSort, pillClass, pageClass },
  ref
) {
  const pills = [{ id: 'all', label: 'Tout' }, ...options]

  return (
    <div
      ref={ref}
      className={`sticky top-[57px] z-30 border-y border-current/10 px-gutter py-3.5 ${pageClass}`}
    >
      <div className="flex items-center justify-between gap-6 max-md:flex-col max-md:items-stretch max-md:gap-3">
        {/* Pastilles : la pastille pleine glisse d'un filtre à l'autre */}
        <div className="mx-[calc(-1*clamp(20px,4vw,64px))] flex gap-2 overflow-x-auto px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
          {pills.map((p) => {
            const on = p.id === active
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p.id)}
                className={`relative shrink-0 rounded-full border px-4 py-1.5 text-xs transition-colors duration-300 ${
                  on ? 'border-transparent' : 'border-current/40 hover:border-current'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="filter-pill"
                    className={`absolute inset-0 rounded-full ${pillClass}`}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={`relative ${on ? pillClass.split(' ').find((c) => c.startsWith('text-')) : ''}`}>
                  {p.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Compteur + tri */}
        <div className="flex shrink-0 items-center justify-between gap-3 text-xs">
          <span className="inline-flex overflow-hidden tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {count}
              </motion.span>
            </AnimatePresence>
            &nbsp;produit{count > 1 ? 's' : ''}
          </span>

          <label className="flex items-center gap-2">
            <span className="opacity-70">Trier</span>
            <span className="relative">
              <select
                value={sort}
                onChange={(e) => onSort(e.target.value)}
                className="appearance-none rounded-full border border-current/40 bg-transparent py-1.5 pl-4 pr-8 text-xs outline-none transition-colors hover:border-current"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id} className="text-ink">
                    {s.label}
                  </option>
                ))}
              </select>
              <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]">
                ▾
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  )
})

export default FilterBar
