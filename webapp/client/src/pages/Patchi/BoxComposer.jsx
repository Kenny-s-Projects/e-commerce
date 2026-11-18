import { forwardRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Praline from '../../components/maison/Praline.jsx'
import Reveal, { FadeUp } from '../../components/maison/Reveal.jsx'
import { PATCHI_IMG } from '../../data/maisonPages.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * « Composer son coffret » : taille, pralines, mot pour la carte.
 * Le coffret du récapitulatif se remplit en direct : chaque praline choisie vient se poser dans les cases,
 * le total défile. « Ajouter le coffret » le met au panier ; WhatsApp pour le composer avec le concierge.
 */
const BoxComposer = forwardRef(function BoxComposer({ flavors, sizes, pricePerKg, onAdd }, ref) {
  const t = useT()
  const [size, setSize] = useState(1)
  const [picked, setPicked] = useState(['ccn01', 'ccn02', 'ccd01'])
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)

  const s = sizes[size]
  const chosen = flavors.filter((f) => picked.includes(f.id))
  const pool = chosen.length ? chosen : flavors
  const price = Math.round(pricePerKg * s.kg)
  const names = chosen.length ? chosen.map((f) => t(f.name)).join(', ') : t('Assortiment de la Maison')

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const add = () => {
    onAdd({
      id: `coffret-${s.id}-${picked.slice().sort().join('-') || 'maison'}`,
      name: t('Coffret composé {size} {weight} ({names})', { size: t(s.label), weight: s.weight, names }) + (note ? t(' · Carte : « {note} »', { note }) : ''),
      price,
      img: PATCHI_IMG,
      boxed: true,
      house: { id: 'patchi', name: 'Patchi' },
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const whatsapp = `https://wa.me/243818592999?text=${encodeURIComponent(`Bonjour, je souhaite composer un coffret Patchi ${s.label} (${s.weight}) : ${names}.`)}`

  return (
    <section ref={ref} id="coffret" className="scroll-mt-16 px-gutter py-[clamp(80px,10vw,140px)]">
      <div className="flex flex-wrap gap-[clamp(32px,5vw,80px)]">
        <div className="min-w-0 flex-[999_1_560px]">
          <Reveal as="p" className="caps text-cacao/80">{t('Sur mesure')}</Reveal>
          <Reveal as="h2" delay={0.1} className="mt-4 text-[clamp(34px,4.4vw,60px)] font-light leading-[1.1]">
            {t('Un coffret se')} <span className="accent text-[1.06em]">{t('compose,')}</span>
          </Reveal>
          <Reveal as="p" delay={0.2} className="text-[clamp(34px,4.4vw,60px)] font-light leading-[1.1]">{t('comme un bouquet.')}</Reveal>

          <FadeUp>
            <p className="caps mb-3.5 mt-12">{t('1 · La taille')}</p>
            <div className="grid grid-cols-3 gap-3">
              {sizes.map((z, i) => (
                <button
                  key={z.id}
                  type="button"
                  aria-pressed={i === size}
                  onClick={() => setSize(i)}
                  className={`relative flex flex-col gap-1.5 border p-5 text-left transition-colors duration-300 ${i === size ? 'border-forest-deep text-paper' : 'border-forest/25 hover:border-forest'}`}
                >
                  {i === size && <motion.span layoutId="box-size" className="absolute inset-[-1px] bg-forest-deep" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                  <span className="accent relative text-[26px] leading-none">{t(z.label)}</span>
                  <span className="relative text-[12px] opacity-75">{z.weight}</span>
                </button>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="caps mb-3.5 mt-9">{t('2 · Les pralines')}</p>
            <div className="flex flex-wrap gap-2">
              {flavors.map((f) => {
                const on = picked.includes(f.id)
                return (
                  <motion.button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(f.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2.5 rounded-full border py-2 pl-2 pr-4 text-[13px] transition-colors duration-300 ${on ? 'border-forest-deep bg-forest-deep text-paper' : 'border-forest/30 hover:border-forest'}`}
                  >
                    <Praline choco={f.choco} className="size-6" />
                    {t(f.name)}
                  </motion.button>
                )
              })}
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="caps mb-3.5 mt-9">{t('3 · Le mot pour la carte')}</p>
            <label htmlFor="mot-carte" className="mb-2 block text-[12px] opacity-75">{t('Facultatif, glissé dans le coffret')}</label>
            <input
              id="mot-carte"
              type="text"
              value={note}
              maxLength={120}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('Joyeux anniversaire, maman…')}
              className="w-full border border-forest/30 bg-transparent px-4 py-4 text-[14px] outline-none transition-colors focus:border-forest"
            />
          </FadeUp>
        </div>

        {/* Récapitulatif, avec le coffret qui se remplit */}
        <FadeUp as="aside" className="flex flex-[1_1_320px] flex-col gap-4 self-start bg-forest-deep p-8 text-paper">
          <p className="caps text-gold">{t('Votre coffret')}</p>
          <div className="rounded-xl bg-green p-[5%]">
            <motion.div layout className={`grid gap-1.5 rounded-lg bg-paper p-2.5 ${s.slots > 12 ? 'grid-cols-5' : s.slots > 6 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <AnimatePresence mode="popLayout">
                {Array.from({ length: s.slots }, (_, i) => {
                  const f = pool[i % pool.length]
                  return (
                    <motion.div
                      key={`${s.id}-${i}-${f.id}`}
                      layout
                      initial={{ scale: 0, y: -20, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.5, delay: i * 0.025, ease }}
                    >
                      <Praline choco={f.choco} cup className="aspect-square w-full" />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          </div>
          <div className="flex justify-between text-[14px]"><span>{t('Taille')}</span><span>{t(s.label)} · {s.weight}</span></div>
          <div className="flex justify-between gap-4 text-[14px]"><span>{t('Pralines')}</span><span className="text-right">{names}</span></div>
          <span className="h-px bg-paper/20" />
          <div className="flex items-baseline justify-between">
            <span className="text-[14px]">{t('Total')}</span>
            <span className="flex overflow-hidden text-[34px] font-light">
              $
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={price} initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '-100%' }} transition={{ duration: 0.45, ease }}>{price}</motion.span>
              </AnimatePresence>
            </span>
          </div>
          <motion.button type="button" onClick={add} whileTap={{ scale: 0.97 }} className="caps bg-gold py-4 text-forest-deep">
            {added ? t('Ajouté au panier ✓') : t('Ajouter le coffret')}
          </motion.button>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="text-center text-[12px] underline underline-offset-4">
            {t('ou le composer avec notre concierge sur WhatsApp')}
          </a>
        </FadeUp>
      </div>
    </section>
  )
})

export default BoxComposer
