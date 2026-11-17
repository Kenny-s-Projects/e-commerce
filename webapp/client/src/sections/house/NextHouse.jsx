import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import HouseMark from '../../components/HouseMark/HouseMark.jsx'

const ease = [0.22, 1, 0.36, 1]

/**
 * « Maison suivante — Continuer chez Kyra » : toute la section est un lien.
 * Fond aux couleurs de la Maison suivante ; au survol, le visuel se soulève et la flèche avance ;
 * au défilement, le visuel glisse en parallaxe.
 *  next : la Maison suivante
 */
export default function NextHouse({ next }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], [60, -60])

  const label = next.name.charAt(0).toUpperCase() + next.name.slice(1)

  return (
    <a
      ref={ref}
      href={`#maison/${next.id}`}
      className={`group relative flex items-center justify-between gap-8 overflow-hidden px-gutter py-[clamp(64px,8vw,112px)] ${next.shop.colors.hero}`}
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        <div className="overflow-hidden">
          <motion.p
            className="caps mb-5 text-[9px] text-gold"
            variants={{ hidden: { y: '100%' }, show: { y: '0%', transition: { duration: 0.8, ease } } }}
          >
            Maison suivante
          </motion.p>
        </div>
        <div className="overflow-hidden pb-[0.1em]">
          <motion.h2
            className="text-[clamp(40px,6vw,88px)] font-light leading-[1.05] tracking-[-0.02em]"
            variants={{ hidden: { y: '100%' }, show: { y: '0%', transition: { duration: 1, ease } } }}
          >
            Continuer chez <span className="accent text-[1.08em]">{label}</span>
            <span
              aria-hidden
              className="ml-4 inline-block text-[0.5em] opacity-0 transition-all duration-500 ease-lux group-hover:translate-x-2 group-hover:opacity-100"
            >
              ⟶
            </span>
          </motion.h2>
        </div>
      </motion.div>

      {/* Visuel de la Maison suivante */}
      <motion.div className="shrink-0 max-sm:hidden" style={{ y: imgY }}>
        <div className="transition-transform duration-700 ease-lux group-hover:-translate-y-3 group-hover:rotate-[-3deg]">
          {next.hero.img ? (
            <img
              src={next.hero.img}
              alt=""
              className={
                next.hero.boxed
                  ? 'size-[clamp(120px,14vw,200px)] rounded-[14px] object-cover shadow-[0_24px_50px_rgba(0,0,0,0.2)]'
                  : 'h-[clamp(140px,16vw,240px)] w-auto mix-blend-multiply'
              }
            />
          ) : (
            <HouseMark house={next} onLight={!next.shop.dark} className="h-[clamp(48px,6vw,88px)]" />
          )}
        </div>
      </motion.div>
    </a>
  )
}
