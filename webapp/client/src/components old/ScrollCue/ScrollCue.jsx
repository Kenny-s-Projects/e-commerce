import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Invitation à défiler : « Défiler » + trait vertical parcouru par un segment.
 * Visible en bas de l'écran tant que l'utilisateur n'a pas commencé à descendre.
 */
export default function ScrollCue({ ready }) {
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {ready && atTop && (
        <motion.button
          type="button"
          aria-label="Défiler vers le bas"
          onClick={() => window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' })}
          className="fixed bottom-12 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3 text-white mix-blend-difference max-md:bottom-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12, transition: { duration: 0.3 } }}
          transition={{ duration: 0.8, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="caps">Défiler</span>
          <span className="relative h-12 w-px overflow-hidden bg-white/30">
            <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-white" />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
