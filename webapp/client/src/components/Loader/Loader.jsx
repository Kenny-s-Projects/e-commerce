import { useEffect, useRef, useState } from 'react'
import { m, useMotionValue, useTransform } from 'framer-motion'
import { markIntroSeen } from '../../utils/intro.js'
import { useT } from '../../i18n/lang.js'
import { houses } from '../../data/houses.js'

const ease = [0.22, 1, 0.36, 1]
const MAX_MS = 1200 // le préchargeur ne reste jamais plus de 1,2 s
const EMBLEM = '/img/emblem.webp'

// Ce qui doit être prêt avant d'ouvrir le site : polices, emblème, visuels du Hero
function essentials() {
  const heroImgs = houses.map((h) => h.hero?.img).filter(Boolean)
  const decode = (src) =>
    new Promise((resolve) => {
      if (!src) return resolve()
      const img = new Image()
      img.src = src
      ;(img.decode ? img.decode() : Promise.reject()).then(resolve, () => {
        img.onload = img.onerror = resolve
        if (img.complete) resolve()
      })
    })
  return [document.fonts?.ready ?? Promise.resolve(), decode(EMBLEM), ...heroImgs.map(decode)]
}

/**
 * Préchargeur : emblème + kclick + compteur 0 → 100 % + barre dorée.
 * Le compteur suit le vrai chargement (polices, emblème, visuel du Hero) et ne dépasse jamais 1,2 s.
 * À 100 %, appelle onComplete ; App le retire et le panneau remonte comme un rideau.
 * N'apparaît qu'une fois par session, et jamais en mode léger (voir App).
 */
export default function Loader({ onComplete }) {
  const t = useT()
  const [count, setCount] = useState(0)
  const progress = useMotionValue(0)
  const barScale = useTransform(progress, [0, 100], [0, 1])
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    document.body.style.overflow = 'hidden' // pas de défilement pendant le chargement

    const tasks = essentials()
    let done = 0
    tasks.forEach((p) => p.then(() => (done += 1), () => (done += 1)))

    const start = performance.now()
    let shown = 0
    let finished = false
    let frame = requestAnimationFrame(function tick(now) {
      const elapsed = now - start
      const ready = done === tasks.length
      // Cible : la part réellement chargée (sans dépasser 90 % tant que tout n'est pas prêt) ; 100 % au plus tard à 1,2 s
      const target = ready || elapsed >= MAX_MS ? 100 : Math.min(90, (done / tasks.length) * 90 + (elapsed / MAX_MS) * 30)
      shown += (target - shown) * (ready || elapsed >= MAX_MS ? 0.35 : 0.12)
      if (target === 100 && 100 - shown < 0.5) shown = 100
      progress.set(shown)
      setCount(Math.round(shown))
      if (shown >= 100 && !finished) {
        finished = true
        markIntroSeen()
        setTimeout(() => onCompleteRef.current(), 120)
        return
      }
      frame = requestAnimationFrame(tick)
    })

    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = ''
    }
  }, [progress])

  const name = 'kclick'.split('')

  return (
    <m.div
      className="fixed inset-0 z-100 flex flex-col bg-black text-paper"
      exit={{ y: '-100%', transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* Centre : emblème, nom, signature */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <m.div
          className="grid size-24 place-items-center rounded-full bg-paper p-1"
          initial={{ opacity: 0, scale: 0.85, rotate: -40 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease }}
        >
          <img src={EMBLEM} alt="" width="96" height="96" decoding="async" className="size-full" />
        </m.div>

        <p className="mt-9 flex text-[30px] font-normal tracking-[0.3em] pl-[0.3em]">
          {name.map((letter, i) => (
            <m.span
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.05, ease }}
            >
              {letter}
            </m.span>
          ))}
        </p>

        <m.p
          className="mt-7 font-serif text-lg italic text-[#96948e]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45, ease }}
        >
          {t('par Kenny’s International')}
        </m.p>
      </div>

      {/* Bas : compteur à gauche, villes à droite */}
      <div className="flex items-end justify-between px-gutter pb-6">
        <p className="font-serif text-[clamp(64px,8vw,104px)] leading-none lining-nums tabular-nums" aria-live="off">
          {count}
          <span className="text-[0.35em] text-gold">%</span>
        </p>
        <p className="caps hidden pb-4 text-[#8a8a85] sm:block">Kinshasa · Pointe-Noire · Lubumbashi</p>
      </div>

      {/* Barre de progression dorée */}
      <m.div className="h-0.5 origin-left bg-gold" style={{ scaleX: barScale }} />
    </m.div>
  )
}
