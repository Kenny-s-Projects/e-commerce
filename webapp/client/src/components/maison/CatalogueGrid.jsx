import { forwardRef, useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import ProductSingle from '../ProductSingle/ProductSingle.jsx'
import FilterPanel from './FilterPanel.jsx'
import { ProductGrid, SkeletonGroup } from '../Skeleton/Skeleton.jsx'
import { useT } from '../../i18n/lang.js'

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
 *  status     : 'ready' (défaut) | 'loading' → squelettes | 'error' → message + « Réessayer » (onRetry)
 *  pageRows   : n lignes de produits affichées d'abord, puis « Voir plus » ajoute n lignes à chaque clic
 *               (nombre de colonnes selon l'écran ; repart à n lignes quand les filtres changent). null = tout.
 */
const CatalogueGrid = forwardRef(function CatalogueGrid(
  { products, total, groups, value, onChange, barClass = '', pill = 'square', cols = 3, house, onAdd, insert = null, insertAfter = 6, title = null, status = 'ready', error = null, onRetry, pageRows = null },
  ref
) {
  const t = useT()
  const radius = pill === 'round' ? 'rounded-full' : ''

  // « Voir plus » : n lignes au départ, n de plus à chaque clic ; on repart à n lignes si la liste change (filtre)
  const perRow = useColumns(cols)
  const [pages, setPages] = useState(1)
  const [listFor, setListFor] = useState(products)
  if (listFor !== products) {
    setListFor(products)
    setPages(1)
  }
  const limit = pageRows ? pageRows * perRow * pages : Infinity
  const shown = products.slice(0, limit)
  const remaining = products.length - shown.length

  const first = insert ? shown.slice(0, insertAfter) : shown
  const rest = insert ? shown.slice(insertAfter) : []

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
              {g.label && <span className="caps w-full opacity-70 md:hidden">{t(g.label)}</span>}
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
                      <m.span
                        layoutId={`pill-${g.key}`}
                        className={`absolute inset-[-1px] bg-(--fg) ${radius}`}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{t(o.label)}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </FilterPanel>
      </div>

      {status === 'loading' ? (
        <SkeletonGroup label={t('Chargement des produits…')} className="px-gutter py-[clamp(48px,6vw,88px)]">
          <ProductGrid count={cols * 2} className={gridClass(cols)} />
        </SkeletonGroup>
      ) : status === 'error' ? (
        <div className="px-gutter py-16 text-center" role="alert">
          <p className="text-[17px]">{t('Les produits ne répondent pas pour le moment.')}</p>
          {error?.message && <p className="mt-2 text-[13px] opacity-75">{t(error.message)}</p>}
          {onRetry && (
            <button type="button" onClick={onRetry} className="caps mt-5 border-b border-current pb-1">
              {t('Réessayer')}
            </button>
          )}
        </div>
      ) : (
        <>
          <Grid items={first} cols={cols} house={house} onAdd={onAdd} />
          {insert && rest.length > 0 && insert}
          {rest.length > 0 && <Grid items={rest} cols={cols} house={house} onAdd={onAdd} />}
          {remaining > 0 && (
            <div className="flex justify-center px-gutter pb-[clamp(48px,6vw,88px)]">
              <m.button
                type="button"
                onClick={() => setPages((n) => n + 1)}
                whileTap={{ scale: 0.97 }}
                className={`caps inline-flex items-center gap-3 border border-current px-8 py-4 text-[11px] transition-colors duration-300 hover:bg-current/10 ${radius}`}
              >
                {t('Voir plus')}
                <span className="opacity-70">· {remaining === 1 ? t('1 produit restant') : t('{n} produits restants', { n: remaining })}</span>
                <span aria-hidden>↓</span>
              </m.button>
            </div>
          )}
          {products.length === 0 && <p className="px-gutter py-16 text-sm opacity-70">{t('Aucun produit pour ces filtres.')}</p>}
        </>
      )}
    </div>
  )
})

// Colonnes réellement affichées (mêmes seuils que gridClass : max-[900px] = largeur < 900 px)
function columnsFor(cols, width) {
  if (cols === 4) return width < 760 ? 2 : width < 1100 ? 3 : 4
  return width < 900 ? 2 : 3
}
function useColumns(cols) {
  const [n, setN] = useState(() => (typeof window === 'undefined' ? cols : columnsFor(cols, window.innerWidth)))
  useEffect(() => {
    const onResize = () => setN(columnsFor(cols, window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [cols])
  return n
}

const gridClass = (cols) => (cols === 4 ? 'grid-cols-4 max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2' : 'grid-cols-3 max-[900px]:grid-cols-2')

function Grid({ items, cols, house, onAdd }) {
  const grid = gridClass(cols)
  return (
    <section className="px-gutter py-[clamp(48px,6vw,88px)]">
      <m.div layout className={`grid ${grid} gap-x-[clamp(16px,2.2vw,32px)] gap-y-[clamp(40px,4.5vw,64px)]`}>
        <AnimatePresence mode="popLayout">
          {items.map((p, i) => (
            <m.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
              transition={{ duration: 0.8, delay: (i % cols) * 0.07, ease }}
            >
              <ProductSingle product={{ ...p, house }} onAdd={onAdd} href={`#maison/${house.id}`} />
            </m.div>
          ))}
        </AnimatePresence>
      </m.div>
    </section>
  )
}

export default CatalogueGrid
