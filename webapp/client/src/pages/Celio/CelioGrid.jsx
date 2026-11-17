import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProductSingle from '../../components/ProductSingle/ProductSingle.jsx'
import Reveal from '../../components/maison/Reveal.jsx'

const ease = [0.22, 1, 0.36, 1]
const HOUSE = { id: 'celio', name: 'Celio' }

/**
 * Grille Celio avec deux affichages : Grille (4 colonnes + tuile éditoriale) ou Liste (grands noms en italique).
 * Le passage de l'un à l'autre est animé ; les produits se réorganisent quand on change de rayon.
 *  products · title · view ('grid' | 'list') · onView · onAdd · onShirts (tuile éditoriale)
 */
const CelioGrid = forwardRef(function CelioGrid({ products, title, view, onView, onAdd, onShirts }, ref) {
  return (
    <section ref={ref} id="grille" className="scroll-mt-16 bg-white px-gutter py-[clamp(72px,9vw,120px)] text-ink [--card:#f3f2ef] [--fg:#111111]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease }}>
            <Reveal as="h2" className="text-[clamp(34px,4.4vw,60px)] tracking-[-0.02em]">{title}</Reveal>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-4 text-[12px]">
          <span className="accent text-base">Affichage</span>
          {[
            ['grid', 'Grille'],
            ['list', 'Liste'],
          ].map(([id, label], i) => (
            <span key={id} className="flex items-center gap-4">
              {i > 0 && <span className="text-ink/30">/</span>}
              <button type="button" aria-pressed={view === id} onClick={() => onView(id)} className={`relative py-1 transition-colors ${view === id ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}>
                {label}
                {view === id && <motion.span layoutId="celio-view" className="absolute inset-x-0 bottom-0 h-px bg-ink" />}
              </button>
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === 'grid' ? (
          <motion.div
            key="grid"
            layout
            className="mt-9 grid grid-cols-4 gap-5 max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="popLayout">
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.06, ease }}
                >
                  <ProductSingle product={{ ...p, house: HOUSE }} onAdd={onAdd} href="#maison/celio" />
                </motion.div>
              ))}
              {/* Tuile éditoriale glissée dans la grille */}
              <motion.button
                key="edito"
                layout
                type="button"
                onClick={onShirts}
                className="group flex aspect-[3/4] flex-col justify-between bg-ink p-7 text-left text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease }}
              >
                <span className="caps text-celio">La pièce maîtresse</span>
                <span className="text-[clamp(24px,2.2vw,30px)] leading-[1.15]">
                  La chemise <span className="accent">Oxford</span>, du lundi au samedi.
                </span>
                <span className="caps">Voir les chemises <span className="inline-block transition-transform duration-500 ease-lux group-hover:translate-x-1.5">⟶</span></span>
              </motion.button>
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="list" className="mt-9 border-t border-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                className="group grid grid-cols-[70px_minmax(0,1.4fr)_minmax(0,1fr)_100px] items-center gap-5 border-b border-ink/15 py-4 transition-colors hover:bg-[#f6f6f4] max-sm:grid-cols-[56px_minmax(0,1fr)_auto]"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.04, ease }}
              >
                <span className="block aspect-[3/4] bg-[#f3f2ef]" />
                <span className="accent text-[clamp(22px,2.4vw,30px)] transition-transform duration-500 ease-lux group-hover:translate-x-2">{p.name}</span>
                <span className="text-[12px] text-ink/60 max-sm:hidden">{p.store}</span>
                <span className="text-right text-[14px]">[Prix]</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {products.length === 0 && <p className="py-12 text-sm opacity-70">Aucun produit dans ce rayon pour le moment.</p>}
    </section>
  )
})

export default CelioGrid
