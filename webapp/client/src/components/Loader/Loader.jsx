import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { markIntroSeen } from '../../utils/intro.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]
const DURATION = 2.2 // durée du compteur 0 → 100 %, en secondes

/**
 * Préchargeur : emblème + kclick + compteur 0 → 100 % + barre dorée.
 * À 100 %, appelle onComplete ; App le retire et le panneau remonte comme un rideau.
 */
export default function Loader({ onComplete }) {
  const t = useT()
  const [count, setCount] = useState(0)
  const progress = useMotionValue(0)
  const barScale = useTransform(progress, [0, 100], [0, 1]) // 0–100 → 0–1 pour la barre
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    // Pas de défilement pendant le chargement
    document.body.style.overflow = 'hidden'

    const controls = animate(progress, 100, {
      duration: DURATION,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => {
        markIntroSeen()
        setTimeout(() => onCompleteRef.current(), 350)
      },
    })

    return () => {
      controls.stop()
      document.body.style.overflow = ''
    }
  }, [progress])

  const name = 'kclick'.split('')

  return (
    <motion.div
      className="fixed inset-0 z-100 flex flex-col bg-black text-paper"
      exit={{ y: '-100%', transition: { duration: 1, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* Centre : emblème, nom, signature */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          className="grid size-24 place-items-center rounded-full bg-paper p-1"
          initial={{ opacity: 0, scale: 0.85, rotate: -60 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.4, ease }}
        >
          <img src="/img/emblem.png" alt="" className="size-full" />
        </motion.div>

        <p className="mt-9 flex text-[30px] font-normal tracking-[0.3em] pl-[0.3em]">
          {name.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 + i * 0.07, ease }}
            >
              {letter}
            </motion.span>
          ))}
        </p>

        <motion.p
          className="mt-7 font-serif text-lg italic text-[#96948e]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1, ease }}
        >
          {t('par Kenny’s International')}
        </motion.p>
      </div>

      {/* Bas : compteur à gauche, villes à droite */}
      <div className="flex items-end justify-between px-gutter pb-6">
        <p className="font-serif text-[clamp(64px,8vw,104px)] leading-none lining-nums tabular-nums">
          {count}
          <span className="text-[0.35em] text-gold">%</span>
        </p>
        <p className="caps hidden pb-4 text-[#8a8a85] sm:block">
          Kinshasa · Pointe-Noire · Lubumbashi
        </p>
      </div>

      {/* Barre de progression dorée */}
      <motion.div
        className="h-0.5 origin-left bg-gold"
        style={{ scaleX: barScale }}
      />
    </motion.div>
  )
}

