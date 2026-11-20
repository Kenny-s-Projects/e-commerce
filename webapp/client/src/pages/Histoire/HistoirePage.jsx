import { useRef } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import useLiteMode from '../../hooks/useLiteMode.js'
import Reveal, { DrawLine, FadeUp } from '../../components/maison/Reveal.jsx'
import { histoire } from '../../data/pages.js'
import { about } from '../../data/home.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Page Notre histoire (#notre-histoire) :
 * hero noir (emblème qui tourne doucement) · manifeste · chiffres clés · frise des chapitres
 * (chaque chapitre arrive au défilement) · boutiques · appel vers les Maisons et le concierge.
 */
export default function HistoirePage() {
  const t = useT()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const emblemRotate = useTransform(scrollYProgress, [0, 1], [0, 90])
  const lite = useLiteMode() // mode léger : pas d'effet lié au défilement

  return (
    <div className="bg-white text-ink">
      {/* ============ Hero ============ */}
      <section ref={heroRef} className="overflow-hidden bg-black px-gutter pb-[clamp(64px,8vw,104px)] text-cream">
        <div className="grid grid-cols-[1fr_auto] items-end gap-12 pt-[clamp(72px,9vw,128px)] max-sm:grid-cols-1">
          <div>
            <Reveal as="p" className="caps text-gold">{t(histoire.eyebrow)}</Reveal>
            <h1 className="mt-6 text-[clamp(48px,7vw,104px)] font-light leading-none tracking-[-0.03em]">
              <Reveal as="span" delay={0.1} className="block">{t(histoire.title)}</Reveal>
              <Reveal as="span" delay={0.25} className="accent block tracking-[-0.01em]">{t(histoire.accent)}</Reveal>
            </h1>
          </div>
          <m.div
            className="size-[clamp(110px,11vw,150px)] rounded-full bg-cream p-1.5"
            style={lite ? undefined : { rotate: emblemRotate }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease }}
          >
            <img decoding="async" src="/img/emblem.webp" alt={t('Emblème Kenny’s International')} className="size-full" />
          </m.div>
        </div>
        <div className="mt-14 overflow-hidden rounded">
          <m.div className="grid aspect-[21/8] place-items-center bg-[#1c1c1c] max-sm:aspect-[4/3]" style={lite ? undefined : { scale: photoScale }}>
            <span className="caps text-[9px] text-cream/50">{t('[Photo d’une boutique Kenny’s, plein cadre, à fournir]')}</span>
          </m.div>
        </div>
      </section>

      {/* ============ Manifeste ============ */}
      <section className="grid grid-cols-[1fr_1.4fr] gap-16 px-gutter py-[clamp(80px,10vw,140px)] max-md:grid-cols-1 max-md:gap-6">
        <Reveal as="p" className="caps text-gold">{t('Ce que nous faisons')}</Reveal>
        <div>
          <Reveal as="h2" className="text-[clamp(32px,4vw,56px)] font-light leading-[1.12]">
            {t(histoire.manifesto.title)} <span className="accent">{t(histoire.manifesto.accent)}</span>
          </Reveal>
          <FadeUp as="p" delay={0.15} className="mt-7 max-w-[560px] text-[16px] leading-[1.8] text-ink/75">{t(histoire.manifesto.text)}</FadeUp>
        </div>
      </section>

      {/* ============ Chiffres clés ============ */}
      <section className="px-gutter pb-[clamp(80px,10vw,140px)]">
        <DrawLine className="bg-ink" />
        <m.div
          className="grid grid-cols-4 max-md:grid-cols-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {about.stats.map((s, i) => (
            <m.div
              key={s.label}
              className={`pt-7 ${i > 0 ? 'border-l border-ink/15 pl-6 max-md:[&:nth-child(3)]:border-0 max-md:[&:nth-child(3)]:pl-0' : 'pr-6'}`}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }}
            >
              <p className="text-[clamp(56px,6vw,96px)] font-light leading-none">
                {s.value}
                {s.suffix && <span className="text-gold">{s.suffix}</span>}
              </p>
              <p className="mt-3 text-[13px]">{t(s.label)}</p>
            </m.div>
          ))}
        </m.div>
      </section>

      {/* ============ Les chapitres ============ */}
      <section className="bg-cream px-gutter py-[clamp(80px,10vw,140px)]">
        <Reveal as="h2" className="mb-14 text-[clamp(32px,4vw,56px)] font-light">
          {t('Les')} <span className="accent">{t('chapitres')}</span>
        </Reveal>
        {histoire.chapters.map((c, i) => (
          <m.div
            key={c.title}
            className={`grid grid-cols-[180px_1fr_1fr] items-center gap-10 border-t border-ink/20 py-8 max-md:grid-cols-1 max-md:gap-4 ${i === histoire.chapters.length - 1 ? 'border-b' : ''}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease }}
          >
            <span className="accent text-[54px] leading-none">{t(c.year)}</span>
            <div>
              <p className="text-[20px]">{t(c.title)}</p>
              <p className="mt-2 text-[14px] leading-[1.7] text-ink/70">{t(c.text)}</p>
            </div>
            <ChapterVisual visual={c.visual} t={t} />
          </m.div>
        ))}
      </section>

      {/* ============ Boutiques ============ */}
      <section className="px-gutter py-[clamp(80px,10vw,140px)]">
        <Reveal as="h2" className="mb-10 text-[clamp(32px,4vw,56px)] font-light">
          {t('Nos')} <span className="accent">{t('boutiques')}</span>
        </Reveal>
        <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {histoire.cities.map((c, i) => (
            <FadeUp key={c.name} delay={i * 0.1}>
              <div className="caps grid aspect-[4/5] place-items-center bg-[#ecebe8] text-[9px] text-ink/60 max-md:aspect-[16/9]">{t('[Photo]')}</div>
              <p className="accent mt-5 text-[32px]">{c.name}</p>
              <p className="mt-1.5 text-[13px] leading-[1.7] text-ink/70">{t(c.text)}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ============ Appel ============ */}
      <section className="flex flex-wrap items-end justify-between gap-8 bg-black px-gutter py-[clamp(72px,9vw,120px)] text-cream">
        <Reveal as="p" className="text-[clamp(36px,4.6vw,64px)] font-light leading-[1.1]">
          {t('Entrez dans')} <span className="accent">{t('nos Maisons.')}</span>
        </Reveal>
        <div className="flex flex-wrap gap-3">
          <a href="#maison/kyra" className="caps bg-cream px-6 py-4 text-black transition-colors hover:bg-gold">{t('Découvrir les Maisons')}</a>
          <a href="https://wa.me/243818592999" target="_blank" rel="noreferrer" className="caps border border-cream px-6 py-4 transition-colors hover:bg-cream hover:text-black">{t('Écrire au concierge')}</a>
        </div>
      </section>
    </div>
  )
}

function ChapterVisual({ visual, t }) {
  if (visual.kind === 'logo') {
    return (
      <div className={`grid aspect-video place-items-center ${visual.bg}`}>
        <img loading="lazy" decoding="async" src={visual.src} alt="" className={visual.w} />
      </div>
    )
  }
  if (visual.kind === 'word') {
    return <div className="grid aspect-video place-items-center bg-black text-[40px] font-medium text-cream">{visual.label}</div>
  }
  return <div className="caps grid aspect-video place-items-center bg-[#e6e0d6] text-[9px] text-ink/60">{t(visual.label)}</div>
}
