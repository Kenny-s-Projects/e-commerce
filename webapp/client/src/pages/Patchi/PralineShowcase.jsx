import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useInView } from 'framer-motion'
import Praline from '../../components/maison/Praline.jsx'
import Reveal from '../../components/maison/Reveal.jsx'
import { getProduct } from '../../data/products.js'
import { cartLine, isPurchasable } from '../../data/live.js'
import { formatPrice } from '../../data/houses.js'
import { useT } from '../../i18n/lang.js'
import useLiteMode from '../../hooks/useLiteMode.js'
import { flyToCart } from '../../components/FlyToCart/flyToCart.js'

const ease = [0.22, 1, 0.36, 1]
const AUTOPLAY_MS = 15_000

/**
 * Les pralines, une par écran, chacune sur sa couleur.
 * Animations : la couleur de fond glisse d'une praline à l'autre, la praline entre en roulant,
 * le nom monte depuis un masque, le prix défile quand on change de quantité.
 * Défilement automatique : praline suivante toutes les 15 s (AUTOPLAY_MS). Toute action (flèche, pastille,
 * poids, ajout) relance les 15 s. En pause quand le clavier est dans la section, quand elle n'est pas
 * à l'écran, et en mode léger. (Pas de pause au survol : la section occupe tout l'écran.)
 * Photo : celle du produit réel (Storage) ; dessin CSS seulement si le produit n'a pas encore de photo.
 *  flavors : pralines (data/maisonPages.js) · weights : quantités · pricePerKg · onAdd
 */
export default function PralineShowcase({ flavors, weights, pricePerKg, onAdd }) {
  const t = useT()
  const [index, setIndex] = useState(0)
  const [weight, setWeight] = useState(0)
  const [dir, setDir] = useState(1)
  const [tick, setTick] = useState(0) // relance le compte à rebours après une action
  const [focused, setFocused] = useState(false)
  const lite = useLiteMode()
  const sectionRef = useRef(null)
  const visualRef = useRef(null)
  const inView = useInView(sectionRef, { amount: 0.35 })
  const f = flavors[index]
  const w = weights[weight]
  // Prix, stock et ajout au panier : produit réel du catalogue (même code ERP), variante du même poids
  const live = getProduct(f.id)
  const variant = live?.live ? live.variants.find((v) => v.label === w.label) ?? live.variants[weight] : null
  const canBuy = Boolean(variant?.available) && isPurchasable(live)
  const price = variant?.price ?? Math.round(pricePerKg * w.kg)
  const stockKg = live?.live ? live.stockKg : f.stock
  const photoOf = (fl) => {
    const p = getProduct(fl.id)
    return p?.live && p.hasPhoto ? p.img : null
  }
  const photo = photoOf(f)

  const restart = () => setTick((n) => n + 1)

  const go = (i) => {
    setDir(i > index ? 1 : -1)
    setIndex((i + flavors.length) % flavors.length)
    restart()
  }

  // Praline suivante toutes les 15 s
  const paused = focused || !inView || lite || flavors.length < 2
  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => {
      setDir(1)
      setIndex((i) => (i + 1) % flavors.length)
    }, AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [paused, index, tick, flavors.length])

  const add = () => {
    if (!canBuy) return
    onAdd(cartLine(live, variant), 1)
    flyToCart({ from: visualRef.current, src: photo })
    restart()
  }

  return (
    <m.section
      ref={sectionRef}
      onFocus={(e) => e.target.matches(':focus-visible') && setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      className="overflow-hidden px-gutter py-[clamp(64px,8vw,112px)]"
      animate={{ backgroundColor: f.bg, color: f.fg }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal as="p" className="caps opacity-80">{t('Les pralines · au poids')}</Reveal>
          <Reveal as="h2" delay={0.1} className="mt-4 text-[clamp(34px,4.4vw,60px)] font-light leading-[1.1]">
            {t('Six pralines,')} <span className="accent text-[1.06em]">{t('six caractères.')}</span>
          </Reveal>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[28px] font-light tabular-nums">
            {String(index + 1).padStart(2, '0')} <span className="text-[11px] opacity-60">/ {String(flavors.length).padStart(2, '0')}</span>
          </span>
          <button type="button" onClick={() => go(index - 1)} aria-label={t('Praline précédente')} className="grid size-12 place-items-center border border-current transition-colors hover:bg-current/10">⟵</button>
          <button type="button" onClick={() => go(index + 1)} aria-label={t('Praline suivante')} className="grid size-12 place-items-center border border-current bg-current">
            <span style={{ color: f.bg }}>⟶</span>
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-[1.1fr_1fr] items-center gap-[clamp(32px,6vw,96px)] max-md:grid-cols-1">
        {/* Visuel : la praline entre en roulant (photo du produit, ou dessin en attendant sa photo) */}
        <div ref={visualRef} className="relative grid aspect-[5/4] place-items-center overflow-hidden rounded-2xl bg-white/10">
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <m.div
              key={f.id}
              custom={dir}
              className={photo ? 'w-[64%]' : 'w-[42%]'}
              variants={{
                enter: (d) => ({ x: `${d * 120}%`, rotate: d * (photo ? 30 : 140), opacity: 0 }),
                center: { x: '0%', rotate: 0, opacity: 1 },
                exit: (d) => ({ x: `${d * -120}%`, rotate: d * (photo ? -30 : -140), opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.9, ease }}
            >
              {photo ? (
                <img src={photo} alt={t(f.name)} className="aspect-square w-full rounded-2xl bg-white object-contain p-[6%] shadow-[0_18px_40px_rgba(0,0,0,0.22)]" draggable={false} />
              ) : (
                <Praline choco={f.choco} className="aspect-square w-full" />
              )}
            </m.div>
          </AnimatePresence>
          <span className="caps absolute right-5 top-5 opacity-70">{t('Réf.')} {f.ref}</span>
          {!photo && <span className="caps absolute bottom-5 left-5 text-[9px] opacity-60">{t('[Photo {ref}.webp à fournir]', { ref: f.ref })}</span>}
          {/* Avancement vers la praline suivante */}
          {!paused && (
            <span key={`${index}-${tick}`} className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-current opacity-50" style={{ animation: `praline-progress ${AUTOPLAY_MS}ms linear forwards` }} aria-hidden />
          )}
        </div>

        {/* Fiche */}
        <div>
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={f.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5, ease }}>
              <p className="caps opacity-80">{t(f.coll)}</p>
              <h3 className="accent mt-3 text-[clamp(48px,5.6vw,84px)] leading-none">{t(f.name)}</h3>
              <p className="mt-5 text-[14px] leading-[1.75] opacity-85">{f.erp} · {t('[Notes de dégustation à fournir]')}</p>
            </m.div>
          </AnimatePresence>

          <p className="caps mb-3 mt-9 opacity-80">{t('Quantité')}</p>
          <div className="flex flex-wrap gap-2">
            {weights.map((wt, i) => (
              <button
                key={wt.label}
                type="button"
                aria-pressed={i === weight}
                onClick={() => {
                  setWeight(i)
                  restart()
                }}
                className="relative rounded-full border border-current/30 px-5 py-2.5 text-[13px]"
              >
                {i === weight && (
                  <m.span layoutId="praline-weight" className="absolute inset-[-1px] rounded-full bg-current" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <span className="relative" style={i === weight ? { color: f.bg } : undefined}>{wt.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-9 flex items-center justify-between gap-5 border-t border-current pt-6">
            <div>
              <p className="flex overflow-hidden text-[34px] font-light">
                $
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.span key={price} initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '-100%' }} transition={{ duration: 0.45, ease }}>
                    {formatPrice(price).slice(1)}
                  </m.span>
                </AnimatePresence>
              </p>
              <p className="mt-1 text-[11px] opacity-70">{live?.live ? t('{n} kg en stock', { n: stockKg }) : t('${p} / kg · {n} kg en stock', { p: pricePerKg, n: stockKg })}</p>
            </div>
            <m.button type="button" onClick={add} disabled={!canBuy} whileTap={{ scale: 0.96 }} className="caps px-7 py-4 disabled:opacity-50" style={{ background: f.fg, color: f.bg }}>
              {canBuy ? t('Ajouter au panier') : live?.live ? t('Épuisé') : t('Bientôt disponible')}
            </m.button>
          </div>
        </div>
      </div>

      {/* Toutes les pralines en pastilles */}
      <div className="mt-12 flex flex-wrap gap-2.5">
        {flavors.map((fl, i) => (
          <button
            key={fl.id}
            type="button"
            onClick={() => go(i)}
            aria-pressed={i === index}
            className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-[12px] transition-colors ${i === index ? 'border-current' : 'border-transparent hover:border-current/40'}`}
          >
            {photoOf(fl) ? (
              <img src={photoOf(fl)} alt="" className="size-6 rounded-full bg-white object-contain" loading="lazy" draggable={false} />
            ) : (
              <Praline choco={fl.choco} className="size-6" />
            )}
            {t(fl.name)}
          </button>
        ))}
      </div>
    </m.section>
  )
}
