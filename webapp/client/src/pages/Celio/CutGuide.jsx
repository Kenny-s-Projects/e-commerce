import { motion } from 'framer-motion'
import { DrawLine } from '../../components/maison/Reveal.jsx'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Trouver sa coupe : trois silhouettes de pantalon qui se dessinent trait par trait à l'écran.
 *  cuts : [{ id, label, note, path }]
 */
export default function CutGuide({ cuts }) {
  const t = useT()
  return (
    <section className="bg-white px-gutter pb-[clamp(80px,10vw,140px)] text-ink">
      <DrawLine className="bg-ink" />
      <div className="grid grid-cols-[1fr_2fr] gap-12 pt-7 max-md:grid-cols-1">
        <p className="caps flex items-center gap-2.5">
          <span aria-hidden className="size-[7px] bg-celio" />
          {t('Trouver sa coupe')}
        </p>
        <div className="grid grid-cols-3 gap-5">
          {cuts.map((c, i) => (
            <motion.div
              key={c.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.12, ease } } }}
            >
              <div className="grid aspect-[1/2] place-items-center bg-[#f3f2ef] p-[12%]">
                <svg viewBox="0 0 100 200" className="h-full" role="img" aria-label={t('Coupe {c}', { c: c.label })}>
                  <motion.path
                    d={c.path}
                    fill="none"
                    stroke="#111111"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1.6, delay: 0.2 + i * 0.15, ease } } }}
                  />
                </svg>
              </div>
              <p className="mt-3.5 text-[22px]">{c.label}</p>
              <p className="mt-1 text-[12px] text-ink/60">{t(c.note)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
