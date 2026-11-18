import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Hero adidas : fond noir, halo de lumière qui suit la souris, trois bandes qui se dressent,
 * titre géant qui monte ligne par ligne, choix Homme / Femme / Enfant (souligné qui glisse).
 * Au défilement : le titre s'éloigne, les bandes pivotent et remontent.
 *  who, onWho : public choisi · options : [{ id, label, count }] · onSee : aller à la grille
 */
export default function AdidasHero({ who, onWho, options, onSee }) {
  const t = useT()
  const ref = useRef(null)
  const reduce = useReducedMotion()

  // Halo
  const mx = useMotionValue(70)
  const my = useMotionValue(40)
  const hx = useSpring(mx, { stiffness: 60, damping: 20 })
  const hy = useSpring(my, { stiffness: 60, damping: 20 })
  const halo = useMotionTemplate`radial-gradient(700px circle at ${hx}% ${hy}%, rgba(255,255,255,0.13), transparent 60%)`
  const onMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 100)
    my.set(((e.clientY - r.top) / r.height) * 100)
  }

  // Défilement
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 160])
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const stripesRotate = useTransform(scrollYProgress, [0, 1], [-24, -38])
  const stripesY = useTransform(scrollYProgress, [0, 1], [0, -220])

  const current = options.find((o) => o.id === who)

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-between overflow-hidden bg-black px-gutter pb-10 pt-[clamp(48px,7vw,96px)] text-white"
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: halo }} />

      {/* Trois bandes en biais */}
      <motion.div aria-hidden className="pointer-events-none absolute -right-24 top-10 flex gap-[clamp(24px,3vw,46px)] max-md:-right-40" style={{ rotate: stripesRotate, y: stripesY }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-[110vh] w-[clamp(48px,6vw,90px)] origin-bottom bg-white/[0.07]"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.3, delay: 0.2 + i * 0.12, ease }}
          />
        ))}
      </motion.div>

      <span className="caps absolute right-[clamp(20px,4vw,64px)] top-6 text-[9px] text-white/50">{t('[Vidéo campagne adidas, en boucle, à fournir]')}</span>

      {/* Titre */}
      <motion.div className="relative max-w-[980px]" style={{ y: titleY, opacity: titleOpacity }}>
        <motion.img
          src="/img/logos/adidas-white.png"
          alt="adidas"
          className="h-[clamp(44px,5vw,64px)] w-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
        />
        <h1 className="mt-9 text-[clamp(60px,9.4vw,152px)] font-medium uppercase leading-[0.9] tracking-[-0.035em]">
          <span className="block overflow-hidden">
            <motion.span className="block" initial={{ y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 1.1, delay: 0.25, ease }}>
              {t('Le sport,')}
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <motion.span className="accent block normal-case tracking-[-0.01em]" initial={{ y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 1.1, delay: 0.4, ease }}>
              {t('en style.')}
            </motion.span>
          </span>
        </h1>
        <motion.p
          className="mt-7 max-w-[420px] text-[15px] leading-[1.7] text-white/75"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease }}
        >
          {t('Chaussures, vêtements et accessoires pour homme, femme et enfant.')}
        </motion.p>
      </motion.div>

      {/* Homme / Femme / Enfant */}
      <motion.div
        className="relative mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-white/20 pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.9, ease }}
      >
        <div className="flex flex-wrap gap-[clamp(20px,4vw,56px)]" role="tablist" aria-label={t('Pour qui')}>
          {options.map((o) => {
            const on = o.id === who
            return (
              <button
                key={o.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onWho(o.id)}
                className={`relative flex items-baseline gap-2.5 pb-2 text-[clamp(30px,4.4vw,64px)] font-medium uppercase tracking-[-0.02em] transition-colors duration-500 ${on ? 'text-white' : 'text-white/35 hover:text-white/70'}`}
              >
                {t(o.label)}
                <span className="text-[12px] font-normal tracking-[0.1em]">{o.count}</span>
                {on && <motion.span layoutId="adidas-who" className="absolute inset-x-0 -bottom-px h-[3px] bg-white" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={onSee} className="caps border border-white px-6 py-4 transition-colors duration-300 hover:bg-white hover:text-black">
          {t('Voir')} {t(current?.label ?? '')} ⟶
        </button>
      </motion.div>
    </section>
  )
}
