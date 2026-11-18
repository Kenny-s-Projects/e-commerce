import { motion } from 'framer-motion'
import SectionTitle from '../../components/SectionTitle/SectionTitle.jsx'
import GiftTile from '../../components/GiftTile/GiftTile.jsx'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Offrir : titre en italique, texte à droite, 4 tuiles idées cadeaux.
 *  gifts : { title, text, items } (voir data/home.js)
 */
export default function Gifts({ gifts }) {
  const t = useT()
  return (
    <section className="bg-white px-gutter pb-[clamp(80px,10vw,140px)] text-ink">
      {/* Filet de séparation avec la Sélection */}
      <div className="mb-[clamp(56px,7vw,96px)] h-px bg-ink/10" />

      <div className="mb-[clamp(36px,4vw,52px)] flex items-end justify-between gap-8 max-sm:flex-col max-sm:items-start">
        <SectionTitle accent={gifts.title} />
        <motion.p
          className="max-w-[320px] text-[13px] leading-[1.7]"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          {t(gifts.text)}
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-4 gap-[clamp(16px,1.8vw,28px)] max-[900px]:grid-cols-2 max-[900px]:gap-y-10"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        {gifts.items.map((item) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 40 },
              show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } },
            }}
          >
            <GiftTile item={item} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
