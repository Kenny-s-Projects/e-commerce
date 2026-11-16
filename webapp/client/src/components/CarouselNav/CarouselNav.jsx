import { AnimatePresence, motion } from 'framer-motion'

/**
 * Compteur "01 / 06" + flèches précédent / suivant.
 *  current : index affiché (0 = premier)
 *  total   : nombre d'éléments
 *  onPrev, onNext : actions des flèches
 */
export default function CarouselNav({ current, total, onPrev, onNext }) {
  const pad = (n) => String(n).padStart(2, '0')
  const btn =
    'grid size-11 place-items-center border border-ink transition-colors duration-400 ease-lux disabled:cursor-default disabled:opacity-30'

  return (
    <div className="flex items-center gap-5">
      <p className="flex items-baseline gap-1.5 tabular-nums">
        {/* Le chiffre glisse vers le haut à chaque changement */}
        <span className="relative inline-flex h-[1.2em] overflow-hidden text-2xl font-light leading-[1.2]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={current}
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {pad(current + 1)}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="caps text-[9px] opacity-60">/ {pad(total)}</span>
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={current === 0}
          aria-label="Précédent"
          className={`${btn} hover:enabled:bg-ink hover:enabled:text-white`}
        >
          ⟵
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={current === total - 1}
          aria-label="Suivant"
          className={`${btn} bg-ink text-white hover:enabled:bg-transparent hover:enabled:text-ink`}
        >
          ⟶
        </button>
      </div>
    </div>
  )
}
