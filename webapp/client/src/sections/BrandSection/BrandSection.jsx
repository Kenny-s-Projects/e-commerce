import { motion } from 'framer-motion'
import SectionTitle from '../../components/SectionTitle/SectionTitle.jsx'
import TitleCta from '../../components/TitleCta/TitleCta.jsx'
import ProductSingle from '../../components/ProductSingle/ProductSingle.jsx'
import { sectionThemes } from '../../data/themes.js'
import { maisonHref } from '../../data/houses.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Section d'une Maison sur la home : SectionTitle + TitleCta + 4 ProductSingle.
 * Même composant pour Kyra, Patchi, adidas et Celio : seules les données changent.
 */
export default function BrandSection({ house, index, total, onAdd }) {
  return (
    <section
      id={house.id}
      className={`px-gutter py-[clamp(80px,10vw,140px)] ${sectionThemes[house.theme]}`}
    >
      <div className="mb-[clamp(48px,5vw,72px)] flex items-end justify-between gap-10 max-sm:flex-col max-sm:items-start">
        <SectionTitle
          index={index}
          total={total}
          title={house.title}
          accent={house.accent}
          accentInline={house.accentInline}
          subtitle={house.subtitle}
        />
        <TitleCta
          name={house.name}
          logo={house.logo}
          label={`Entrer chez ${house.name}`}
          href={maisonHref(house.id)}
        />
      </div>

      <motion.div
        className="grid grid-cols-4 gap-[clamp(16px,1.8vw,28px)] max-[900px]:grid-cols-2 max-[900px]:gap-y-10"
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
            <ProductSingle product={product} onAdd={onAdd} href={maisonHref(house.id)} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
