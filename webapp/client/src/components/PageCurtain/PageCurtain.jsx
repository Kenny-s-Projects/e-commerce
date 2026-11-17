import { motion } from 'framer-motion'

/**
 * Rideau de transition entre deux pages : un panneau de la couleur de la page d'arrivée
 * couvre l'écran puis se retire vers le haut.
 *  className : couleur du rideau (ex. 'bg-green')
 */
export default function PageCurtain({ className = 'bg-beige' }) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[90] origin-top ${className}`}
      initial={{ scaleY: 1 }}
      animate={{ scaleY: 0 }}
      transition={{ duration: 0.9, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
    />
  )
}
