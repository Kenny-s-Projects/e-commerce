import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Conciergerie : commander en parlant à quelqu'un, sur WhatsApp.
 *  concierge : { eyebrow, title, accent, titleEnd, text, phone, href } (voir data/home.js)
 */
export default function Concierge({ concierge }) {
  const t = useT()
  return (
    <section id="conciergerie" className="bg-black px-gutter pb-[clamp(80px,10vw,140px)] text-white">
      <m.div
        className="flex flex-wrap items-center justify-between gap-12 border border-gold/50 px-[clamp(24px,5vw,74px)] py-[clamp(56px,7vw,110px)]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease }}
      >
        <div className="max-w-[760px]">
          <p className="caps mb-7 text-gold">{t(concierge.eyebrow)}</p>
          <h2 className="text-[clamp(32px,3.6vw,50px)] font-light leading-[1.15]">
            {t(concierge.title)} <span className="accent text-[1.08em]">{t(concierge.accent)}</span> {t(concierge.titleEnd)}
          </h2>
          <p className="mt-7 max-w-[620px] text-[15px] leading-[1.75] text-white/70">{t(concierge.text)}</p>
        </div>

        <a
          href={concierge.href}
          target="_blank"
          rel="noreferrer"
          className="group relative z-0 inline-flex h-[68px] items-center gap-[18px] overflow-hidden border border-gold px-11 text-[13px] tracking-[0.24em] transition-colors duration-500 ease-lux hover:text-black
            before:absolute before:inset-0 before:-z-10 before:translate-y-[101%] before:bg-gold before:transition-transform before:duration-500 before:ease-lux hover:before:translate-y-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1L4 20z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          {concierge.phone}
        </a>
      </m.div>
    </section>
  )
}
