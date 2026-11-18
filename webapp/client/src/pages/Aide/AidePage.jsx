import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Accordion from '../../components/Accordion/Accordion.jsx'
import Reveal from '../../components/maison/Reveal.jsx'
import SearchIcon from '../../components/icons/SearchIcon.jsx'
import { aide } from '../../data/pages.js'
import { contact } from '../../data/home.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

// Minuscules et sans accents : « livre » trouve « Livrez-vous »
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Page Aide (#aide/<rubrique>, #contact → rubrique Contact) :
 * recherche dans les questions · 3 raccourcis · menu des rubriques (chaque rubrique a son adresse)
 * · cartes d'infos + questions fréquentes · bloc WhatsApp.
 *  section : id de la rubrique active
 */
export default function AidePage({ section }) {
  const t = useT()
  const [q, setQ] = useState('')
  const current = aide.sections.find((s) => s.id === section) ?? aide.sections[0]

  // Recherche : toutes les questions de toutes les rubriques
  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean)
    if (!words.length) return null
    return aide.sections.flatMap((s) =>
      s.faq.filter((f) => words.every((w) => norm(`${t(f.q)} ${t(f.a)} ${t(s.label)}`).includes(w))).map((f) => ({ ...f, section: s }))
    )
  }, [q, t])

  return (
    <div className="bg-white text-ink">
      {/* ============ En-tête + recherche ============ */}
      <section className="bg-cream px-gutter pb-14 pt-[clamp(56px,7vw,104px)]">
        <Reveal as="p" className="caps text-gold">{t('Aide')}</Reveal>
        <Reveal as="h1" delay={0.1} className="mt-4 text-[clamp(40px,5.6vw,80px)] font-light leading-[1.02]">
          {t('Comment pouvons-nous')} <span className="accent">{t('vous aider ?')}</span>
        </Reveal>
        <motion.label
          htmlFor="aide-q"
          className="mt-9 flex h-[58px] max-w-[640px] items-center gap-3 rounded-xl bg-white px-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease }}
        >
          <SearchIcon className="size-5 shrink-0 opacity-50" />
          <span className="sr-only">{t('Rechercher dans l’aide')}</span>
          <input
            id="aide-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('Livraison, paiement, retrait…')}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
        </motion.label>

        {/* Résultats de recherche, ou raccourcis */}
        <AnimatePresence mode="wait" initial={false}>
          {results ? (
            <motion.div key="results" className="mt-8 max-w-[760px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite">
              <p className="caps mb-3 text-ink/60">{results.length ? t(results.length > 1 ? '{n} réponses' : '{n} réponse', { n: results.length }) : t('Aucune réponse : écrivez-nous sur WhatsApp')}</p>
              {results.map((r) => (
                <a key={r.q} href={`#aide/${r.section.id}`} onClick={() => setQ('')} className="block border-b border-ink/10 py-4 hover:pl-2 transition-[padding] duration-300">
                  <span className="caps block text-[9px] text-gold">{t(r.section.label)}</span>
                  <span className="mt-1 block text-[15px]">{t(r.q)}</span>
                </a>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="shortcuts"
              className="mt-10 grid grid-cols-3 gap-4 max-md:grid-cols-1"
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
            >
              {aide.shortcuts.map((c) => (
                <motion.a
                  key={c.section}
                  href={`#aide/${c.section}`}
                  className={`block rounded-2xl border bg-white p-6 transition-colors duration-300 ${c.section === current.id ? 'border-ink' : 'border-transparent hover:border-ink/30'}`}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
                >
                  <span className="caps block text-gold">{t(c.kicker)}</span>
                  <span className="mt-2.5 block text-[20px]">{t(c.title)}</span>
                  <span className="mt-1.5 block text-[13px] text-ink/65">{t(c.text)}</span>
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ============ Rubriques ============ */}
      <section className="flex flex-wrap gap-[clamp(32px,5vw,80px)] px-gutter py-[clamp(56px,7vw,96px)]">
        <nav aria-label={t('Rubriques')} className="max-w-[280px] flex-[1_1_240px] max-md:max-w-none">
          {aide.sections.map((s) => {
            const on = s.id === current.id
            return (
              <a
                key={s.id}
                href={`#aide/${s.id}`}
                aria-current={on ? 'page' : undefined}
                className={`flex items-center gap-3 border-b border-ink/12 py-4 text-[15px] transition-colors ${on ? 'text-ink' : 'text-ink/55 hover:text-ink'}`}
              >
                <span className="relative size-[7px]">{on && <motion.span layoutId="aide-dot" className="absolute inset-0 bg-gold" />}</span>
                {t(s.label)}
              </a>
            )
          })}
        </nav>

        <div className="min-w-0 flex-[999_1_560px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={current.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }} transition={{ duration: 0.5, ease }}>
              <h2 className="text-[clamp(30px,3.6vw,48px)] font-light">{t(current.label)}</h2>
              <p className="mt-3.5 max-w-[620px] text-[15px] leading-[1.75] text-ink/75">{t(current.intro)}</p>

              {current.cards.length > 0 && (
                <div className="mt-8 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  {current.cards.map((k) => {
                    const Tag = k.href ? 'a' : 'div'
                    return (
                      <Tag
                        key={k.kicker}
                        {...(k.href ? { href: k.href, target: k.href.startsWith('http') ? '_blank' : undefined, rel: 'noreferrer' } : {})}
                        className={`block rounded-2xl bg-cream p-6 ${k.href ? 'transition-colors hover:bg-[#ece6dc]' : ''}`}
                      >
                        <p className="caps text-gold">{t(k.kicker)}</p>
                        <p className="mt-2.5 break-words text-[22px] font-light">{t(k.title)}</p>
                        <p className="mt-2 text-[13px] leading-[1.7] text-ink/75">{t(k.text)}</p>
                      </Tag>
                    )
                  })}
                </div>
              )}

              {current.faq.length > 0 && (
                <div className="mt-10">
                  <Accordion key={current.id} items={current.faq.map((f) => ({ title: t(f.q), content: t(f.a) }))} size="lg" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ============ Toujours une personne ============ */}
      <section className="mx-[clamp(20px,4vw,64px)] mb-[clamp(64px,8vw,104px)] flex flex-wrap items-center justify-between gap-8 rounded-2xl bg-forest-deep p-[clamp(32px,5vw,64px)] text-paper">
        <div>
          <Reveal as="p" className="text-[clamp(26px,3vw,40px)] font-light">
            {t('Toujours une')} <span className="accent">{t('personne')}</span> {t('pour vous répondre.')}
          </Reveal>
          <p className="mt-2.5 text-[14px] text-paper/75">{contact.phone} · {contact.email} · {t('Horaires [à confirmer]')}</p>
        </div>
        <a href="https://wa.me/243818592999" target="_blank" rel="noreferrer" className="rounded-full bg-paper px-7 py-4 text-[14px] text-forest-deep transition-transform hover:scale-[1.03]">
          {t('Écrire sur WhatsApp')}
        </a>
      </section>
    </div>
  )
}
