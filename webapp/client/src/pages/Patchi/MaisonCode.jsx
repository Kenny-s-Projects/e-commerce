import { motion } from 'framer-motion'
import Reveal from '../../components/maison/Reveal.jsx'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * « Le code de la Maison » : 4 repères numérotés.
 * Animations : titre qui monte, filet du haut de chaque colonne qui se dessine,
 * colonnes qui arrivent l'une après l'autre.
 */
export default function MaisonCode({ pillars }) {
  const t = useT()
  return (
    <section className="px-gutter py-[clamp(80px,10vw,140px)] text-center">
      <Reveal as="p" className="caps text-cacao/80">{t('Le code de la Maison')}</Reveal>
      <Reveal as="h2" delay={0.1} className="mx-auto mt-5 max-w-[820px] text-[clamp(34px,4.4vw,60px)] font-light leading-[1.1]">
        {t('Un chocolat se choisit')} <span className="accent text-[1.06em]">{t('à la praline près.')}</span>
      </Reveal>

      <motion.div
        className="mt-[clamp(48px,6vw,80px)] grid grid-cols-4 gap-x-8 gap-y-12 text-left max-[900px]:grid-cols-2 max-sm:grid-cols-1"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ show: { transition: { staggerChildren: 0.14 } } }}
      >
        {pillars.map((p) => (
          <motion.div
            key={p.n}
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } }}
          >
            <motion.span
              className="mb-6 block h-px origin-left bg-forest/40"
              variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.1, ease } } }}
            />
            <span className="accent block text-[44px] leading-none text-gold">{p.n}</span>
            <h3 className="mt-4 text-lg font-normal">{t(p.title)}</h3>
            <p className="mt-2 text-[13px] leading-[1.7] opacity-75">{t(p.text)}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
