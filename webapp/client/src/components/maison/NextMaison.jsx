import { useRef } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import useLiteMode from '../../hooks/useLiteMode.js'
import { maisonHref } from '../../data/houses.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * « Maison suivante — Continuer chez … » : toute la section est un lien.
 * Le titre monte depuis un masque, le visuel glisse en parallaxe et se soulève au survol.
 *  id, name  : Maison suivante
 *  className : couleurs de la Maison suivante
 *  visual    : élément affiché à droite (photo, logo…)
 */
export default function NextMaison({ id, name, className = '', visual = null }) {
  const t = useT()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [50, -50])
  const lite = useLiteMode() // mode léger : pas de parallaxe

  return (
    <a ref={ref} href={maisonHref(id)} className={`group relative block overflow-hidden px-gutter py-[clamp(72px,9vw,120px)] ${className}`}>
      <div className="flex items-center justify-between gap-8 max-sm:flex-col max-sm:items-start">
        {/* Le déclencheur est le bloc visible ; les lignes montent depuis leur masque */}
        <m.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
          <div className="overflow-hidden">
            <m.p className="caps mb-5 opacity-80" variants={{ hidden: { y: '100%' }, show: { y: '0%', transition: { duration: 0.8, ease } } }}>
              {t('Maison suivante')}
            </m.p>
          </div>
          <div className="overflow-hidden pb-[0.1em]">
            <m.p
              className="text-[clamp(44px,6.4vw,96px)] font-light leading-none tracking-[-0.03em]"
              variants={{ hidden: { y: '100%' }, show: { y: '0%', transition: { duration: 1.1, delay: 0.1, ease } } }}
            >
              {t('Continuer chez')} <span className="accent inline-block pr-[0.1em] text-[1.06em]">{name}</span>
              <span aria-hidden className="ml-4 inline-block text-[0.5em] opacity-0 transition-all duration-500 ease-lux group-hover:translate-x-2 group-hover:opacity-100">⟶</span>
            </m.p>
          </div>
        </m.div>
        {visual && (
          <m.div style={lite ? undefined : { y }} className="shrink-0">
            <div className="transition-transform duration-700 ease-lux group-hover:-translate-y-3 group-hover:-rotate-3">{visual}</div>
          </m.div>
        )}
      </div>
    </a>
  )
}
