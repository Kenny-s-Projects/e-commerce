import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Hero Celio : « celio » géant dont les lettres montent une à une, astérisque rouge qui tourne en se posant,
 * photo de campagne qui se dévoile en volet. Au défilement : le nom glisse plus lentement que la page
 * et la photo zoome doucement.
 */
export default function CelioHero({ intro }) {
  const t = useT()
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const wordY = useTransform(scrollYProgress, [0, 1], [0, 140])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])

  return (
    <section ref={ref} className="overflow-hidden bg-white px-gutter pt-12 text-ink">
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.8, ease }}
      >
        <p className="flex max-w-[330px] gap-2.5 text-[13px] leading-[1.7]">
          <span aria-hidden className="mt-[7px] size-[7px] flex-none bg-celio" />
          {t(intro)}
        </p>
      </motion.div>

      {/* Nom géant */}
      <motion.div className="mt-5 flex items-start justify-center" style={{ y: reduce ? 0 : wordY }}>
        <h1 className="flex text-[clamp(130px,27vw,400px)] font-medium leading-[0.8] tracking-[-0.05em]" aria-label="celio">
          {'celio'.split('').map((l, i) => (
            <span key={i} className="block overflow-hidden pb-[0.04em]" aria-hidden>
              <motion.span className="block" initial={{ y: '100%' }} animate={{ y: '0%' }} transition={{ duration: 1.1, delay: 0.1 + i * 0.07, ease }}>
                {l}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.span
          aria-hidden
          className="text-[clamp(64px,12vw,180px)] font-medium leading-[0.7] text-celio"
          initial={{ rotate: -180, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.55, ease }}
        >
          *
        </motion.span>
      </motion.div>

      <motion.div
        className="caps mt-4 flex justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.9 }}
      >
        <span>{t('Mode homme')}</span>
        <span>Kinshasa · Gombe</span>
      </motion.div>

      {/* Photo de campagne, dévoilée en volet */}
      <motion.div
        className="mt-5 overflow-hidden"
        initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={{ duration: 1.4, delay: 0.6, ease }}
      >
        <motion.div className="grid aspect-[21/8] place-items-center bg-[#ecebe8] max-sm:aspect-[4/3]" style={{ scale: reduce ? 1 : imgScale }}>
          <span className="caps text-[9px] text-ink/60">{t('[Photo campagne Celio, plein cadre, à fournir]')}</span>
        </motion.div>
      </motion.div>
    </section>
  )
}
