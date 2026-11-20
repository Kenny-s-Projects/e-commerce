import { useRef } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import useLiteMode from '../../hooks/useLiteMode.js'
import { useT } from '../../i18n/lang.js'

/**
 * « Essentiel [image] bien coupé » : au défilement, les deux mots se rapprochent de l'image
 * depuis les bords et l'image s'agrandit. L'animation suit le défilement, dans les deux sens.
 */
export default function WordsImage() {
  const t = useT()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const left = useTransform(scrollYProgress, [0, 1], ['-40%', '0%'])
  const right = useTransform(scrollYProgress, [0, 1], ['40%', '0%'])
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1])
  const lite = useLiteMode() // mode léger : mots et image à leur place, sans suivre le défilement

  return (
    <section ref={ref} className="grid grid-cols-[1fr_1.3fr_1fr] items-center gap-6 overflow-hidden bg-white px-gutter py-[clamp(80px,10vw,140px)] text-ink max-sm:grid-cols-1 max-sm:text-center">
      <m.p className="text-[clamp(32px,3.6vw,52px)] tracking-[-0.02em]" style={lite ? undefined : { x: left, opacity }}>
        {t('Essentiel')}
      </m.p>
      <m.div className="grid aspect-[4/5] place-items-center bg-[#ecebe8]" style={lite ? undefined : { scale }}>
        <span className="caps text-[9px] text-ink/60">{t('[Détail matière : col de chemise]')}</span>
      </m.div>
      <m.p className="accent text-right text-[clamp(32px,3.6vw,52px)] max-sm:text-center" style={lite ? undefined : { x: right, opacity }}>
        {t('bien coupé')}
      </m.p>
    </section>
  )
}
