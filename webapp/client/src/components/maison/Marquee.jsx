import { useRef } from 'react'
import { m, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity,  } from 'framer-motion'
import useLiteMode from '../../hooks/useLiteMode.js'
import { useT } from '../../i18n/lang.js'

// Ramène v dans l'intervalle [min, max[ (pour boucler sans fin)
const wrap = (min, max, v) => {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

/**
 * Bandeau de mots qui défile en continu. Il accélère quand on fait défiler la page,
 * et change de sens quand on remonte.
 *  items     : mots à afficher
 *  speed     : vitesse de base (en % par seconde)
 *  separator : élément entre deux mots
 */
export default function Marquee({ items, speed = 2.5, separator = '✕', className = '' }) {
  const t = useT()
  const reduce = useLiteMode() // mode léger ou « Réduire les animations »
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const boost = useTransform(velocity, [0, 1000], [0, 5], { clamp: false })
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`)
  const direction = useRef(-1)

  useAnimationFrame((_, delta) => {
    if (reduce) return
    const b = boost.get()
    if (b < 0) direction.current = 1
    else if (b > 0) direction.current = -1
    baseX.set(baseX.get() + direction.current * speed * (delta / 1000) * (1 + Math.abs(b)))
  })

  // Deux copies identiques côte à côte : quand la 1re sort, la 2e prend sa place
  const row = items.flatMap((w, i) => [
    <span key={`w${i}`}>{t(w)}</span>,
    <span key={`s${i}`} aria-hidden className="opacity-40">{separator}</span>,
  ])

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-label={items.map((w) => t(w)).join(', ')}>
      <m.div className="flex w-max gap-12" style={{ x }} aria-hidden>
        <div className="flex gap-12">{row}</div>
        <div className="flex gap-12">{row}</div>
      </m.div>
    </div>
  )
}
