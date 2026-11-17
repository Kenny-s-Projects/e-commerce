import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import HouseMark from '../../components/HouseMark/HouseMark.jsx'

const ease = [0.22, 1, 0.36, 1]

/**
 * Bandeau éditorial glissé au milieu de la grille (« Un coffret Patchi se compose… »).
 * Animations : le visuel se dévoile du bas vers le haut puis glisse en parallaxe,
 * le texte monte ligne par ligne.
 *  house    : la Maison (shop.editorial, couleurs)
 *  onFilter : (id) => void, si le bouton filtre une collection
 */
export default function EditorialBand({ house, onFilter }) {
  const { shop } = house
  const ed = shop.editorial
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  const cta = (
    <>
      {ed.cta}
      <span aria-hidden className="transition-transform duration-500 ease-lux group-hover:translate-x-1.5">⟶</span>
    </>
  )
  const ctaClass = 'caps group mt-8 inline-flex items-center gap-3 border-b border-current pb-1.5'

  return (
    <section ref={ref} className={`my-[clamp(48px,6vw,88px)] px-gutter py-[clamp(40px,5vw,64px)] ${shop.colors.band}`}>
      {/* L'animation part du conteneur : un élément entièrement masqué n'est jamais « visible » pour le navigateur */}
      <motion.div
        className="grid grid-cols-[1.1fr_1fr] items-center gap-[clamp(32px,6vw,96px)] max-md:grid-cols-1"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Visuel : se dévoile du bas vers le haut */}
        <motion.div
          className={`relative grid aspect-[4/3] place-items-center overflow-hidden ${shop.radius} ${
            house.id === 'patchi' ? 'bg-green' : 'bg-white/5'
          }`}
          variants={{
            hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
            show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.2, ease } },
          }}
        >
          <motion.div className="absolute inset-[-6%] grid place-items-center" style={{ y: imgY }}>
            {ed.img ? (
              <img
                src={ed.img}
                alt=""
                className={house.shop.fit === 'contain' ? 'h-[70%] w-auto object-contain' : 'size-full object-cover'}
              />
            ) : (
              <HouseMark house={house} className="h-[22%]" textClass="text-7xl" />
            )}
          </motion.div>
        </motion.div>

        {/* Texte */}
        <motion.div variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}>
          {[
            <p key="e" className="caps mb-5 text-[9px] opacity-70">{ed.eyebrow}</p>,
            <h2 key="t" className="text-[clamp(26px,2.8vw,40px)] font-light leading-[1.2]">
              {ed.title.before} <span className="accent text-[1.08em]">{ed.title.accent}</span>
              {ed.title.after && ` ${ed.title.after}`}
            </h2>,
            ed.filter ? (
              <button key="c" type="button" onClick={() => onFilter(ed.filter)} className={ctaClass}>
                {cta}
              </button>
            ) : (
              <a key="c" href={ed.href} target="_blank" rel="noreferrer" className={ctaClass}>
                {cta}
              </a>
            ),
          ].map((el, i) => (
            <div key={i} className="overflow-hidden">
              <motion.div
                variants={{
                  hidden: { y: '100%', opacity: 0 },
                  show: { y: '0%', opacity: 1, transition: { duration: 0.9, ease } },
                }}
              >
                {el}
              </motion.div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
