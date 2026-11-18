import { motion } from 'framer-motion'
import Reveal from '../../components/maison/Reveal.jsx'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Les rayons : trois cartes inclinées. Elles tombent en place l'une après l'autre,
 * se redressent et se soulèvent au survol. Un clic filtre la grille.
 *  rayons : [{ id, n, label, note, tilt }] · counts : { id: n } · onPick(id)
 */
export default function Rayons({ rayons, counts, onPick }) {
  const t = useT()
  return (
    <section className="bg-black px-gutter py-[clamp(80px,10vw,140px)] text-white">
      <div className="text-center">
        <Reveal as="p" className="caps text-white/60">{t('Les rayons')}</Reveal>
        <Reveal as="h2" delay={0.1} className="mt-4 text-[clamp(34px,4.4vw,60px)] tracking-[-0.02em]">
          {t('Du terrain')} <span className="accent text-[1.06em]">{t('à la ville.')}</span>
        </Reveal>
      </div>

      <div className="mt-[clamp(48px,6vw,80px)] grid grid-cols-3 gap-6 max-md:grid-cols-1">
        {rayons.map((r, i) => (
          <motion.button
            key={r.id}
            type="button"
            onClick={() => onPick(r.id)}
            className="flex min-h-[460px] flex-col justify-between border border-white/10 bg-[#161616] p-7 text-left max-md:min-h-[360px]"
            initial={{ opacity: 0, y: 120, rotate: r.tilt * 4 }}
            whileInView={{ opacity: 1, y: 0, rotate: r.tilt }}
            whileHover={{ rotate: 0, y: -14, transition: { duration: 0.5, ease } }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.1, delay: i * 0.12, ease }}
          >
            <span className="caps flex justify-between text-white/60">
              <span>{r.n}</span>
              <span>{t('{n} produits', { n: counts[r.id] ?? 0 })}</span>
            </span>
            <span className="grid flex-1 place-items-center">
              <span className="caps border border-dashed border-white/25 px-8 py-16 text-[9px] text-white/50">[{t('Photo')} {t(r.label)}]</span>
            </span>
            <span>
              <span className="block text-[36px] font-medium uppercase tracking-[-0.02em]">{t(r.label)}</span>
              <span className="mt-2 block text-[13px] text-white/60">{t(r.note)}</span>
              <span className="caps mt-5 block">{t('Explorer')} ↗</span>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
