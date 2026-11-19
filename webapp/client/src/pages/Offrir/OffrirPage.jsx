import { AnimatePresence, motion } from 'framer-motion'
import ProductSingle from '../../components/ProductSingle/ProductSingle.jsx'
import Reveal, { FadeUp } from '../../components/maison/Reveal.jsx'
import { offrir } from '../../data/pages.js'
import { getProduct } from '../../data/products.js'
import { useLive } from '../../data/live.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Page Offrir (#offrir/<onglet>) : une seule page, 4 onglets (Pour elle, Pour lui, Coffrets, Moins de 50 $).
 * Chaque onglet a son adresse : les tuiles « Offrir » de l'accueil y mènent directement.
 * Animations : pastille d'onglet qui glisse, carte éditoriale et produits qui se renouvellent en fondu.
 *  tab : id de l'onglet actif · onAdd : ajout au panier
 */
export default function OffrirPage({ tab, onAdd }) {
  const t = useT()
  const current = offrir.tabs.find((x) => x.id === tab) ?? offrir.tabs[0]
  useLive() // les produits Patchi arrivent du catalogue réel
  const products = current.ids.map(getProduct).filter(Boolean)

  return (
    <div className="bg-white text-ink [--card:#f6f3ee] [--fg:var(--color-ink)]">
      {/* En-tête */}
      <section className="px-gutter pb-10 pt-[clamp(56px,7vw,104px)] text-center">
        <Reveal as="p" className="caps text-gold">{t('Toutes Maisons confondues')}</Reveal>
        <Reveal as="h1" delay={0.1} className="accent mt-4 text-[clamp(64px,9vw,128px)] leading-[0.95]">{t(offrir.title)}</Reveal>
        <FadeUp as="p" delay={0.2} className="mx-auto mt-5 max-w-[460px] text-[15px] leading-[1.7] text-ink/75">{t(offrir.text)}</FadeUp>

        {/* Onglets */}
        <nav aria-label={t('Idées cadeaux')} className="mt-10 inline-flex flex-wrap justify-center gap-1.5 rounded-full bg-[#f4f1ec] p-1.5">
          {offrir.tabs.map((tb) => {
            const on = tb.id === current.id
            return (
              <a
                key={tb.id}
                href={`#offrir/${tb.id}`}
                aria-current={on ? 'page' : undefined}
                className={`relative rounded-full px-6 py-3 text-[14px] transition-colors duration-300 ${on ? 'text-ink' : 'text-ink/60 hover:text-ink'}`}
              >
                {on && <motion.span layoutId="offrir-tab" className="absolute inset-0 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)]" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
                <span className="relative">{t(tb.label)}</span>
              </a>
            )
          })}
        </nav>
      </section>

      {/* Sélection de l'onglet */}
      <section className="px-gutter pb-[clamp(72px,8vw,120px)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            className="grid grid-cols-[1.1fr_2fr] items-start gap-7 max-[1000px]:grid-cols-1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.25 } }}
            transition={{ duration: 0.6, ease }}
          >
            {/* Carte éditoriale */}
            <div className={`relative flex min-h-[560px] flex-col justify-end overflow-hidden rounded-2xl p-8 md:sticky md:top-24 max-[1000px]:min-h-[380px] ${current.tone}`}>
              <motion.img
                src={current.hero}
                alt=""
                className={`absolute inset-0 m-auto ${current.heroFit === 'cover' ? 'size-full object-cover' : 'h-[70%] w-auto object-contain mix-blend-multiply'}`}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease }}
              />
              <div className="relative rounded-xl bg-white/92 p-6">
                <p className="accent text-[38px] leading-none">{t(current.label)}</p>
                <p className="mt-2.5 text-[13px] leading-[1.7] text-ink/75">{t(current.text)}</p>
              </div>
            </div>

            {/* Produits */}
            <div className="grid grid-cols-3 gap-6 max-[1200px]:grid-cols-2">
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 + i * 0.06, ease }}>
                  <ProductSingle product={p} onAdd={onAdd} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Services cadeau */}
      <section className="bg-ink px-gutter py-[clamp(56px,6vw,88px)] text-cream">
        <Reveal as="h2" className="text-[clamp(30px,3.4vw,46px)] font-light">
          {t('Le cadeau,')} <span className="accent">{t('jusqu’au bout')}</span>
        </Reveal>
        <motion.div
          className="mt-10 grid grid-cols-3 gap-8 max-md:grid-cols-1"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          {offrir.services.map((s) => (
            <motion.div key={s.n} className="border-t border-cream/25 pt-5" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}>
              <p className="accent text-[32px] text-gold">{s.n}</p>
              <p className="mt-2.5 text-[17px]">{t(s.title)}</p>
              <p className="mt-1.5 text-[13px] leading-[1.7] text-cream/70">{t(s.text)}</p>
            </motion.div>
          ))}
        </motion.div>
        <a href="https://wa.me/243818592999" target="_blank" rel="noreferrer" className="caps mt-10 inline-block border-b border-gold pb-1.5">{t('Composer un cadeau avec le concierge')} ⟶</a>
      </section>
    </div>
  )
}
