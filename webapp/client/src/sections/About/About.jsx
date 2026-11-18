import { motion } from 'framer-motion'
import SectionTitle from '../../components/SectionTitle/SectionTitle.jsx'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Kenny's International : phrase de marque, texte et chiffres clés.
 *  about : { eyebrow, title, accent, text, stats: [{ value, suffix?, label }], link } (voir data/home.js)
 */
export default function About({ about }) {
  const t = useT()
  return (
    <section id="kennys" className="bg-black px-gutter pt-[clamp(80px,10vw,150px)] pb-[clamp(56px,7vw,110px)] text-white">
      <div className="grid grid-cols-12 gap-x-12 gap-y-14 max-[900px]:grid-cols-1">
        <div className="col-span-7 max-[900px]:col-span-1">
          <SectionTitle eyebrow={about.eyebrow} title={about.title} accent={about.accent} accentInline />
          <motion.p
            className="mt-8 max-w-[560px] text-[15px] leading-[1.8] text-white/70"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, delay: 0.3, ease }}
          >
            {t(about.text)}
          </motion.p>
        </div>

        <motion.dl
          className="col-span-5 grid grid-cols-2 gap-x-11 max-[900px]:col-span-1"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          {about.stats.map((s, i) => (
            <motion.div
              key={s.label}
              className={`border-t border-gold/45 pt-9 ${i < 2 ? 'pb-14' : ''}`}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } },
              }}
            >
              <dd className="font-serif text-[clamp(56px,5.6vw,80px)] leading-[0.9]">
                {s.value}
                {s.suffix && <span className="text-gold">{s.suffix}</span>}
              </dd>
              <dt className="caps mt-5 text-white/70">{t(s.label)}</dt>
            </motion.div>
          ))}
        </motion.dl>
      </div>

      <a
        href={about.link.href}
        className="caps mt-[clamp(64px,8vw,120px)] inline-block border-b border-white pb-2 transition-opacity duration-400 hover:opacity-70"
      >
        {t(about.link.label)}
      </a>
    </section>
  )
}
