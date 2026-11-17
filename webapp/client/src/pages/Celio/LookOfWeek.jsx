import { useState } from 'react'
import { motion } from 'framer-motion'
import Reveal, { DrawLine, FadeUp } from '../../components/maison/Reveal.jsx'

const ease = [0.22, 1, 0.36, 1]

/**
 * Le look de la semaine : photo portée avec un point numéroté par pièce (le point respire),
 * liste des pièces à cocher, commande du look sur WhatsApp.
 * Les pièces n'ont pas encore de prix : la commande passe par le concierge.
 *  look : { title, accent, pieces: [{ id, name, cat, x, y }] }
 */
export default function LookOfWeek({ look }) {
  const [picked, setPicked] = useState(look.pieces.map((p) => p.id).slice(0, 3))
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const chosen = look.pieces.filter((p) => picked.includes(p.id))
  const message = `Bonjour, je souhaite commander le look Celio : ${chosen.map((p) => p.name).join(', ')}.`

  return (
    <section className="flex flex-wrap items-center gap-[clamp(32px,5vw,80px)] bg-[#f6f6f4] px-gutter py-[clamp(80px,10vw,140px)] text-ink">
      {/* Photo + points */}
      {/* Volet de gauche à droite. Le déclencheur est le conteneur : un élément entièrement masqué n'est jamais « visible » pour le navigateur */}
      <motion.div className="flex-[1_1_440px]" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
        <motion.div
          className="relative aspect-[4/5] bg-[#e2e1dd]"
          variants={{
            hidden: { clipPath: 'inset(0% 100% 0% 0%)' },
            show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.3, ease } },
          }}
        >
          <span className="caps absolute inset-0 grid place-items-center text-[9px] text-ink/60">[Photo du look porté]</span>
          {look.pieces.map((p, i) => {
            const on = picked.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                aria-label={`${p.name}${on ? ', choisie' : ''}`}
                aria-pressed={on}
                onClick={() => toggle(p.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-ink"
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
                />
                <span className={`relative grid size-9 place-items-center rounded-full border border-ink text-[12px] transition-colors duration-300 ${on ? 'bg-ink text-white' : 'bg-white'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Pièces */}
      <div className="max-w-[520px] flex-[1_1_360px]">
        <Reveal as="p" className="caps text-ink/60">Le look de la semaine</Reveal>
        <Reveal as="h2" delay={0.1} className="mt-4 text-[clamp(34px,4.4vw,60px)] leading-[1.1] tracking-[-0.02em]">
          {look.title} <span className="accent text-[1.06em]">{look.accent}</span>
        </Reveal>

        <div className="mt-8">
          <DrawLine className="bg-ink" />
          {look.pieces.map((p, i) => {
            const on = picked.includes(p.id)
            return (
              <FadeUp key={p.id} delay={0.1 + i * 0.08} y={14}>
                <button type="button" onClick={() => toggle(p.id)} aria-pressed={on} className="grid w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3.5 py-4 text-left">
                  <span className={`grid size-[22px] place-items-center border border-ink text-[12px] transition-colors duration-300 ${on ? 'bg-ink text-white' : ''}`}>{on ? '✓' : ''}</span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.14em] text-ink/60">{String(i + 1).padStart(2, '0')} · {p.cat}</span>
                    <span className="text-[15px]">{p.name}</span>
                  </span>
                  <span className="text-[14px]">[Prix]</span>
                </button>
                <DrawLine className="bg-ink/15" delay={0.1 + i * 0.08} />
              </FadeUp>
            )
          })}
        </div>

        <motion.a
          href={chosen.length ? `https://wa.me/243818592999?text=${encodeURIComponent(message)}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!chosen.length}
          whileTap={{ scale: 0.98 }}
          className={`caps mt-7 block py-[18px] text-center text-white transition-colors duration-300 ${chosen.length ? 'bg-ink hover:bg-celio' : 'pointer-events-none bg-ink/40'}`}
        >
          Commander {chosen.length} pièce{chosen.length > 1 ? 's' : ''} sur WhatsApp
        </motion.a>
      </div>
    </section>
  )
}
