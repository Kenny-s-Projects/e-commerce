import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FilterBar from '../../components/FilterBar/FilterBar.jsx'
import ShopCard from '../../components/ShopCard/ShopCard.jsx'
import EditorialBand from './EditorialBand.jsx'
import { sorters } from '../../data/sorts.js'

const ease = [0.22, 1, 0.36, 1]
const BAND_AFTER = 6 // le bandeau éditorial s'intercale après 6 produits

/**
 * Catalogue d'une Maison : barre de filtres collante + grille 3 par ligne
 * + bandeau éditorial au milieu (vue « Tout », tri « Sélection »).
 * Changer de filtre ou de tri anime les cartes qui partent, arrivent et se replacent.
 *  house, filter, onFilter, sort, onSort : état géré par HousePage
 *  barRef : référence de la barre (pour y faire défiler depuis les collections)
 */
const Catalogue = forwardRef(function Catalogue({ house, filter, onFilter, sort, onSort }, barRef) {
  const { shop, products, collections } = house

  const list = products
    .filter((p) => filter === 'all' || p.cat === filter)
    .slice()
    .sort(sorters[sort])

  const withBand = filter === 'all' && sort === 'selection' && list.length > BAND_AFTER
  const chunks = withBand ? [list.slice(0, BAND_AFTER), list.slice(BAND_AFTER)] : [list]

  return (
    <div>
      <FilterBar
        ref={barRef}
        options={collections.map(({ id, label }) => ({ id, label }))}
        active={filter}
        onChange={onFilter}
        count={list.length}
        sort={sort}
        onSort={onSort}
        pillClass={shop.colors.pill}
        pageClass={shop.colors.page}
      />

      <div className="pb-[clamp(72px,9vw,128px)] pt-[clamp(40px,5vw,64px)]">
        {chunks.map((chunk, i) => (
          <div key={i}>
            {i === 1 && <EditorialBand house={house} onFilter={onFilter} />}
            <Grid products={chunk} house={house} />
          </div>
        ))}

        {list.length === 0 && (
          <p className="px-gutter py-20 text-center text-sm opacity-70">Aucun produit dans cette collection pour le moment.</p>
        )}
      </div>
    </div>
  )
})

function Grid({ products, house }) {
  return (
    <motion.div
      layout
      className="grid grid-cols-3 gap-x-[clamp(16px,1.8vw,28px)] gap-y-[clamp(36px,4vw,56px)] px-gutter max-[900px]:grid-cols-2"
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.3 } }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, delay: (i % 3) * 0.08, ease }}
          >
            <ShopCard product={product} house={house} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export default Catalogue
