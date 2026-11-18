import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { kyraCatalog, patchiCatalog, adidasCatalog, celioCatalog } from '../../data/catalog.js'
import { formatPrice } from '../../data/houses.js'
import SearchIcon from '../icons/SearchIcon.jsx'

const ease = [0.22, 1, 0.36, 1]

// Tous les produits, avec leur Maison et le lien vers leur fiche produit
const INDEX = [
  ...kyraCatalog.map((p) => ({ ...p, maison: 'Kyra', href: `#produit/${p.id}` })),
  ...patchiCatalog.map((p) => ({ ...p, maison: 'Patchi', href: `#produit/${p.id}` })),
  ...adidasCatalog.map((p) => ({ ...p, maison: 'adidas', href: `#produit/${p.id}` })),
  ...celioCatalog.map((p) => ({ ...p, maison: 'Celio', href: `#produit/${p.id}` })),
]

// Minuscules et sans accents : « hermes » trouve « Hermès »
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const SUGGESTIONS = ['Parfum', 'Coffret', 'Samba', 'Chemise', 'Dior', 'Tablette']

/**
 * Barre de recherche : elle descend du haut de l'écran, le champ prend le focus,
 * les résultats (toutes Maisons) s'affichent en direct pendant la frappe.
 * Fermeture : croix, Échap, clic à côté ou clic sur un résultat.
 *  open · onClose
 */
export default function SearchBar({ open, onClose }) {
  return <AnimatePresence>{open && <SearchPanel onClose={onClose} />}</AnimatePresence>
}

function SearchPanel({ onClose }) {
  const [q, setQ] = useState('')

  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean)
    if (!words.length) return []
    return INDEX.filter((p) => {
      const hay = norm(`${p.name} ${p.store ?? ''} ${p.maison}`)
      return words.every((w) => hay.includes(w))
    }).slice(0, 8)
  }, [q])

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Recherche">
      <motion.button
        type="button"
        aria-label="Fermer la recherche"
        className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      <motion.div
        className="absolute inset-x-0 top-0 bg-white px-gutter pb-8 pt-5 text-ink shadow-[0_30px_60px_rgba(0,0,0,0.12)]"
        initial={{ y: '-100%' }}
        animate={{ y: '0%' }}
        exit={{ y: '-100%', transition: { duration: 0.45, ease } }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="mx-auto max-w-[760px]">
          {/* Champ */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              if (results[0]) {
                window.location.hash = results[0].href
                onClose()
              }
            }}
            className="flex items-center gap-3 rounded-md bg-[#f4f4f4] px-4"
          >
            <SearchIcon className="size-5 shrink-0 opacity-60" />
            <label htmlFor="kclick-search" className="sr-only">Rechercher un produit</label>
            <input
              id="kclick-search"
              type="search"
              autoFocus
              autoComplete="off"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit, une Maison…"
              className="h-14 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-ink/45 [&::-webkit-search-cancel-button]:appearance-none"
            />
            <button type="button" onClick={onClose} className="caps shrink-0 py-2 opacity-70 hover:opacity-100">Fermer</button>
          </form>

          {/* Suggestions (champ vide) ou résultats */}
          {q.trim() === '' ? (
            <motion.div className="mt-5 flex flex-wrap items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <span className="caps mr-1 text-ink/60">Suggestions</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-ink/20 px-3.5 py-1.5 text-[12px] transition-colors hover:border-ink">
                  {s}
                </button>
              ))}
            </motion.div>
          ) : (
            <div className="mt-4" aria-live="polite">
              <p className="caps mb-2 text-ink/60">
                {results.length ? `${results.length} résultat${results.length > 1 ? 's' : ''}` : 'Aucun résultat'}
              </p>
              <ul>
                <AnimatePresence initial={false}>
                  {results.map((p, i) => (
                    <motion.li
                      key={`${p.maison}-${p.id}`}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03, ease }}
                    >
                      <a href={p.href} onClick={onClose} className="group flex items-center gap-4 border-b border-ink/10 py-3">
                        <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded bg-[#f4f4f4]">
                          {p.img && <img src={p.img} alt="" className={p.boxed ? 'size-full object-cover' : 'size-[80%] object-contain'} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="caps block text-[9px] text-ink/60">{p.maison}{p.store ? ` · ${p.store}` : ''}</span>
                          <span className="block truncate text-[15px] transition-transform duration-400 ease-lux group-hover:translate-x-1">{p.name}</span>
                        </span>
                        <span className="shrink-0 text-[13px]">{formatPrice(p.price, p.unit)}</span>
                      </a>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
