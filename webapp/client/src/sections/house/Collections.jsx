import { motion } from 'framer-motion'
import SectionTitle from '../../components/SectionTitle/SectionTitle.jsx'
import CollectionCard from '../../components/CollectionCard/CollectionCard.jsx'

const ease = [0.22, 1, 0.36, 1]

/**
 * Les collections d'une Maison, en chapitres. Un clic filtre la grille produit.
 *  house    : la Maison
 *  active   : id de la collection filtrée ('all' sinon)
 *  onSelect : (id) => void
 */
export default function Collections({ house, active, onSelect }) {
  const { shop, collections, products } = house
  const count = (id) => products.filter((p) => p.cat === id).length

  return (
    <section className="px-gutter pb-[clamp(56px,7vw,96px)] pt-[clamp(72px,9vw,128px)]">
      <div className="mb-[clamp(32px,4vw,48px)] flex items-end justify-between gap-8 max-sm:flex-col max-sm:items-start">
        <SectionTitle title={shop.collectionsTitle.before} accent={shop.collectionsTitle.accent} accentInline />
        <motion.p
          className="max-w-[300px] text-[13px] leading-[1.7]"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          {shop.collectionsText}
        </motion.p>
      </div>

      {/* Rangée de chapitres : défile horizontalement s'il y en a beaucoup */}
      <motion.div
        className="mx-[calc(-1*clamp(20px,4vw,64px))] flex snap-x gap-[clamp(12px,1.4vw,20px)] overflow-x-auto px-gutter pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {collections.map((c) => (
          <motion.div
            key={c.id}
            className="min-w-[clamp(140px,13vw,240px)] flex-1 snap-start"
            variants={{
              hidden: { opacity: 0, y: 50, rotate: 1.5 },
              show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.9, ease } },
            }}
          >
            <CollectionCard
              collection={c}
              house={house}
              count={count(c.id)}
              active={active === c.id}
              onSelect={onSelect}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
