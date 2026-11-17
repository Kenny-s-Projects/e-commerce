import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProductSingle from '../ProductSingle/ProductSingle.jsx'
import FilterPanel from './FilterPanel.jsx'

const ease = [0.22, 1, 0.36, 1]

/**
 * Filtres collés sous la barre + grille de produits, commun aux pages Maison.
 *  products   : produits déjà filtrés à afficher
 *  total      : nombre affiché à droite (« 12 produits »)
 *  groups     : [{ key, label?, options: [{ id, label }] }] → une rangée de pastilles par groupe
 *               (label affiché dans le panneau mobile)
 *  value      : filtres actifs { key: id } ; onChange(key, id)
 *  barClass   : fond et couleurs de la barre (identiques à la page)
 *  pill       : 'round' (Patchi) | 'square'
 *  cols       : 3 ou 4 colonnes sur ordinateur
 *  house      : { id, name } ajoutés aux produits (panier)
 *  onAdd      : ajout au panier
 *  insert     : élément glissé après les `insertAfter` premiers produits (bandeau éditorial…)
 *  title      : titre au-dessus des filtres (facultatif)
 */
const CatalogueGrid = forwardRef(function CatalogueGrid(
  { products, total, groups, value, onChange, barClass = '', pill = 'square', cols = 3, house, onAdd, insert = null, insertAfter = 6, title = null },
  ref
) {
  const radius = pill === 'round' ? 'rounded-full' : ''
  const first = insert ? products.slice(0, insertAfter) : products
  const rest = insert ? products.slice(insertAfter) : []

  return (
    <div id="grille">
      {title}
      <div ref={ref} className={`sticky top-16 z-30 border-y border-current/15 ${barClass}`}>
        <FilterPanel
          id={`filtres-${house.id}`}
          activeCount={Object.values(value).filter(Boolean).length}
          total={total}
          onClear={() => groups.forEach((g) => value[g.key] && onChange(g.key, value[g.key]))}
          round={pill === 'round'}
        >
          {groups.map((g, gi) => (
            <div key={g.key} className={`flex flex-wrap items-center gap-2 ${gi > 0 ? 'border-l border-current/15 pl-6 max-md:border-0 max-md:pl-0' : ''}`}>
              {g.label && <span className="caps w-full opacity-70 md:hidden">{g.label}</span>}
              {g.options.map((o) => {
                const on = value[g.key] === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(g.key, o.id)}
                    className={`relative h-9 border px-4 text-[12px] transition-colors duration-300 ${radius} ${
                      on ? 'border-transparent text-(--card)' : 'border-current/25 hover:border-current'
                    }`}
                  >
                    {/* Pastille pleine qui glisse d'un filtre à l'autre */}
                    {on && (
                      <motion.span
                        layoutId={`pill-${g.key}`}
                        className={`absolute inset-[-1px] bg-(--fg) ${radius}`}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{o.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </FilterPanel>
      </div>

      <Grid items={first} cols={cols} house={house} onAdd={onAdd} />
      {insert && rest.length > 0 && insert}
      {rest.length > 0 && <Grid items={rest} cols={cols} house={house} onAdd={onAdd} />}
      {products.length === 0 && <p className="px-gutter py-16 text-sm opacity-70">Aucun produit pour ces filtres.</p>}
    </div>
  )
})

function Grid({ items, cols, house, onAdd }) {
  const grid = cols === 4 ? 'grid-cols-4 max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2' : 'grid-cols-3 max-[900px]:grid-cols-2'
  return (
    <section className="px-gutter py-[clamp(48px,6vw,88px)]">
      <motion.div layout className={`grid ${grid} gap-x-[clamp(16px,2.2vw,32px)] gap-y-[clamp(40px,4.5vw,64px)]`}>
        <AnimatePresence mode="popLayout">
          {items.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
              transition={{ duration: 0.8, delay: (i % cols) * 0.07, ease }}
            >
              <ProductSingle product={{ ...p, house }} onAdd={onAdd} href={`#maison/${house.id}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

export default CatalogueGrid
