import { motion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

/*
 * Important : le déclencheur « à l'écran » est toujours le conteneur visible, jamais l'élément masqué.
 * Un élément entièrement caché (sous un masque, rétréci à 0) n'est jamais vu comme visible
 * par le navigateur, et son animation ne se lancerait pas.
 */

/**
 * Le texte monte depuis un masque quand il entre à l'écran (titres, sur-titres).
 *  as        : balise du conteneur (div par défaut)
 *  delay     : retard en secondes
 *  className : classes du conteneur (taille, couleur…)
 *  once      : false → rejoue à chaque passage
 */
export default function Reveal({ as = 'div', delay = 0, className = '', once = true, children }) {
  const M = motion[as]
  return (
    <M className={`overflow-hidden pb-[0.08em] ${className}`} initial="hidden" whileInView="show" viewport={{ once, amount: 0.5 }}>
      <motion.span
        className="block"
        variants={{ hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 1, delay, ease } } }}
      >
        {children}
      </motion.span>
    </M>
  )
}

/**
 * Apparition douce (fondu + léger glissement), pour les paragraphes et les blocs.
 */
export function FadeUp({ as = 'div', delay = 0, y = 24, className = '', children, ...rest }) {
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.9, delay, ease }}
      {...rest}
    >
      {children}
    </M>
  )
}

/**
 * Filet qui se dessine de gauche à droite (séparateurs de listes, tableaux).
 */
export function DrawLine({ className = 'bg-current/20', delay = 0 }) {
  return (
    <motion.span aria-hidden className="block h-px" initial="hidden" whileInView="show" viewport={{ once: true, amount: 1 }}>
      <motion.span
        className={`block h-px origin-left ${className}`}
        variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.2, delay, ease } } }}
      />
    </motion.span>
  )
}
