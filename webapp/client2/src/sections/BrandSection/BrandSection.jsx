import { motion } from 'framer-motion'
import SectionTitle from '../../components/SectionTitle/SectionTitle.jsx'
import TitleCta from '../../components/TitleCta/TitleCta.jsx'
import ProductSingle from '../../components/ProductSingle/ProductSingle.jsx'
import './BrandSection.css'

const ease = [0.22, 1, 0.36, 1]

/**
 * Section d'une Maison sur la home : SectionTitle + TitleCta + 4 ProductSingle.
 * Réutilisable pour Patchi, adidas et Celio (le fond suit house.theme).
 */
export default function BrandSection({ house, index, total, onAdd }) {
  return (
    <section id={house.id} className={`brand-section brand-section--${house.theme}`}>
      <div className="brand-section__head">
        <SectionTitle
          index={index}
          total={total}
          title={house.title}
          accent={house.accent}
          subtitle={house.subtitle}
        />
        <TitleCta
          name={house.name}
          logo={house.logo}
          label={`Entrer chez ${house.name}`}
          href={`#maison/${house.id}`}
        />
      </div>

      <motion.div
        className="brand-section__grid"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        {house.products.slice(0, 4).map((product) => (
          <motion.div
            key={product.id}
            variants={{
              hidden: { opacity: 0, y: 40 },
              show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } },
            }}
          >
            <ProductSingle product={product} onAdd={onAdd} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}