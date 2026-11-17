import { motion } from 'framer-motion'
import Reveal, { DrawLine } from '../../components/maison/Reveal.jsx'

const ease = [0.22, 1, 0.36, 1]

/**
 * Le vestiaire : les 8 rayons en vignettes. Elles arrivent en cascade ;
 * un clic sélectionne le rayon (cadre qui se dessine) et filtre la grille.
 *  cats : [{ id, label }] · active : id · onPick(id)
 */
export default function Vestiaire({ cats, active, onPick }) {
  return (
    <section className="bg-white px-gutter pb-14 text-ink">
      <div className="flex flex-wrap items-end justify-between gap-6 pb-4">
        <Reveal as="h2" className="text-[clamp(34px,4.4vw,60px)] tracking-[-0.02em]">
          Le <span className="accent text-[1.06em]">vestiaire</span>
        </Reveal>
        <p className="text-[12px]">{cats.length} rayons</p>
      </div>
      <DrawLine className="bg-ink" />

      <motion.div
        className="mt-7 grid grid-cols-[repeat(8,minmax(110px,1fr))] gap-3.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        {cats.map((c) => {
          const on = c.id === active
          return (
            <motion.button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(c.id)}
              className="group text-left"
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }}
            >
              <span className={`block aspect-[3/4] overflow-hidden bg-[#ecebe8] outline outline-1 outline-offset-[3px] transition-[outline-color] duration-500 ${on ? 'outline-ink' : 'outline-transparent'}`}>
                <span className="caps grid size-full place-items-center text-[8px] text-ink/60 transition-transform duration-700 ease-lux group-hover:scale-105">[Photo]</span>
              </span>
              <span className={`mt-2.5 block text-[12px] ${on ? 'font-medium' : ''}`}>{c.label}</span>
            </motion.button>
          )
        })}
      </motion.div>
    </section>
  )
}
