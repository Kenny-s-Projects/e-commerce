import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useMotionValue, useSpring } from 'framer-motion'
import Reveal, { DrawLine } from '../../components/maison/Reveal.jsx'
import { PATCHI_IMG } from '../../data/maisonPages.js'
import { useT } from '../../i18n/lang.js'
import { SkeletonGroup } from '../../components/Skeleton/Skeleton.jsx'

const ease = [0.22, 1, 0.36, 1]

// Image de chaque collection (public/img/patchi/collections/<slug>.webp), sinon le visuel Patchi
const COLLECTION_IMG = {
  smallboxes: '/img/patchi/collections/smallboxes.webp',
  giftboxes: '/img/patchi/collections/giftboxes.webp',
  deluxe: '/img/patchi/collections/deluxe.webp',
  classic: '/img/patchi/collections/classic.webp',
  sansucre: '/img/patchi/collections/sansucre.webp',
}
const imageOf = (id) => COLLECTION_IMG[id] ?? PATCHI_IMG

// Texte des cartes (mobile et tablette)
const COLLECTION_TEXT = {
  classic: 'Finesse, Noblesse, Audace, Diamantine… les pralines de toujours, servies au poids : 250 g, 500 g ou 1 kg.',
  giftboxes: 'De grandes boîtes garnies, prêtes à offrir, de 445 g à 470 g.',
  deluxe: 'Capricio, Prestige, Parfait, les Croq’… les pralines fourrées, servies au poids.',
  smallboxes: 'De 100 g à 315 g, pour un merci, une visite ou un petit plaisir.',
  sansucre: 'Lait aux fruits secs ou noir aux amandes, sans sucre ajouté, au poids.',
}

/**
 * Index des collections : grands titres en italique, numérotés.
 * Animations : les filets se dessinent un à un ; au survol, la ligne glisse
 * et la vignette de la collection survolée suit la souris (ordinateur) ; d'une collection
 * à l'autre, l'image change en fondu.
 *  collections : [{ id, label, note }] · counts : { id: n } · onPick(id)
 *  loading     : catalogue en cours de chargement → lignes squelettes à la place des chapitres
 * Mobile et tablette (< 1024 px) : cartes photo qu'on fait glisser du doigt (voir CollectionCards).
 */
export default function CollectionIndex({ collections, counts, total, onPick, loading = false }) {
  const t = useT()
  const [hover, setHover] = useState(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 25 })
  const sy = useSpring(y, { stiffness: 200, damping: 25 })

  // Images préchargées après l'affichage : le survol les montre tout de suite
  useEffect(() => {
    if (loading) return
    const id = setTimeout(() => collections.forEach((c) => (new Image().src = imageOf(c.id))), 1200)
    return () => clearTimeout(id)
  }, [loading, collections])

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - r.left)
    y.set(e.clientY - r.top)
  }

  return (
    <section className="px-gutter pb-[clamp(80px,10vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6 pb-5">
        <Reveal as="h2" className="text-[clamp(34px,4.4vw,60px)] font-light">
          {t('Les')} <span className="accent text-[1.06em]">{t('collections')}</span>
        </Reveal>
        {!loading && <p className="text-[12px]">{t('{n} produits · {m} chapitres', { n: total, m: collections.length })}</p>}
      </div>
      <DrawLine className="bg-forest" />

      {loading && (
        <SkeletonGroup label={t('Chargement des collections…')} className="[--sk:color-mix(in_srgb,var(--color-forest)_9%,transparent)]">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="grid grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)_150px] items-center gap-6 border-b border-forest/20 px-2 py-7 max-md:grid-cols-[40px_minmax(0,1fr)_auto] max-md:gap-3">
              <div className="sk h-2.5 w-6 rounded-full" />
              <div className="sk h-[clamp(26px,3vw,42px)] w-3/5 rounded" />
              <div className="sk h-3 w-4/5 rounded-full max-md:hidden" />
              <div className="sk ml-auto h-2.5 w-20 rounded-full" />
            </div>
          ))}
        </SkeletonGroup>
      )}

      {!loading && <CollectionCards collections={collections} counts={counts} onPick={onPick} />}

      <div className="relative max-lg:hidden" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {/* Vignette qui suit la souris */}
        <AnimatePresence>
          {hover && (
            <m.div
              className="pointer-events-none absolute left-0 top-0 z-10 grid w-[clamp(160px,16vw,240px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl max-md:hidden"
              style={{ x: sx, y: sy }}
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.35, ease }}
            >
              <AnimatePresence initial={false}>
                <m.img
                  key={hover}
                  src={imageOf(hover)}
                  alt=""
                  decoding="async"
                  className="col-start-1 row-start-1 aspect-square w-full object-cover"
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                />
              </AnimatePresence>
            </m.div>
          )}
        </AnimatePresence>

        {collections.map((c, i) => (
          <div key={c.id}>
            <button
              type="button"
              onClick={() => onPick(c.id)}
              onMouseEnter={() => setHover(c.id)}
              className="group grid w-full grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)_150px] items-center gap-6 px-2 py-7 text-left transition-[padding,background-color] duration-500 ease-lux hover:bg-forest/5 hover:pl-7 max-md:grid-cols-[40px_minmax(0,1fr)_auto] max-md:gap-3"
            >
              <span className="text-[11px] tracking-[0.22em] text-cacao/80">{String(i + 1).padStart(2, '0')}</span>
              <span className="accent text-[clamp(30px,3.6vw,52px)] leading-none">{t(c.label)}</span>
              <span className="text-[13px] opacity-75 max-md:hidden">{t(c.note)}</span>
              <span className="caps text-right">
                {t('{n} produits', { n: counts[c.id] ?? 0 })} <span className="inline-block transition-transform duration-500 ease-lux group-hover:translate-x-1.5">⟶</span>
              </span>
            </button>
            <DrawLine className="bg-forest/20" delay={i * 0.08} />
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Mobile et tablette : une carte par collection, photo en fond sous un dégradé sombre,
 * surtitre et titre en haut, texte en bas. Les cartes défilent à l'horizontale (glisser du doigt),
 * avec arrêt net sur chaque carte ; points de position en dessous. Toucher une carte → catalogue filtré.
 */
function CollectionCards({ collections, counts, onPick }) {
  const t = useT()
  const track = useRef(null)
  const [current, setCurrent] = useState(0)

  // Largeur d'un pas = une carte + l'espace entre deux cartes
  const step = () => {
    const el = track.current
    const [a, b] = el?.children ?? []
    return a && b ? b.offsetLeft - a.offsetLeft : el?.clientWidth || 1
  }
  const onScroll = () => {
    const el = track.current
    if (!el) return
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    setCurrent(atEnd ? collections.length - 1 : Math.round(el.scrollLeft / step()))
  }
  const goTo = (i) => track.current?.scrollTo({ left: i * step(), behavior: 'smooth' })

  return (
    <div className="lg:hidden">
      <div
        ref={track}
        onScroll={onScroll}
        className="-mx-gutter mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-gutter px-gutter pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t('Collections')}
      >
        {collections.map((c, i) => (
          <m.button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className="group relative aspect-[4/5] w-[78vw] max-w-[380px] shrink-0 snap-start overflow-hidden rounded-2xl bg-forest-deep text-left text-white sm:w-[calc(50%-8px)] sm:max-w-none"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease, delay: Math.min(i, 3) * 0.08 }}
          >
            <m.img
              src={imageOf(c.id)}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover"
              initial={{ scale: 1.12 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.2, ease }}
            />
            {/* Dégradé sombre : texte lisible en haut et en bas, même sur une photo claire */}
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,20,15,0.78)_0%,rgba(12,20,15,0.35)_30%,rgba(12,20,15,0.25)_50%,rgba(12,20,15,0.88)_100%)]" />

            <span className="absolute inset-x-6 top-6 block">
              <span className="caps block text-[11px] tracking-[0.2em] text-gold">
                {String(i + 1).padStart(2, '0')} · {t('{n} produits', { n: counts[c.id] ?? 0 })}
              </span>
              <span className="mt-1.5 block text-[clamp(26px,7vw,34px)] font-semibold leading-tight">{t(c.label)}</span>
            </span>

            <span className="absolute inset-x-6 bottom-6 block">
              <span className="block text-[14px] leading-[1.55] text-white/90">{t(COLLECTION_TEXT[c.id] ?? c.note)}</span>
              <span className="caps mt-4 inline-flex items-center gap-2 border-b border-gold pb-1 text-[11px] text-gold">
                {t('Voir la collection')} <span aria-hidden className="transition-transform duration-500 ease-lux group-active:translate-x-1.5">⟶</span>
              </span>
            </span>
          </m.button>
        ))}
      </div>

      {/* Points de position */}
      <div className="mt-5 flex justify-center gap-2">
        {collections.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={t('Collection {n}', { n: i + 1 })}
            aria-current={i === current ? 'true' : undefined}
            className={`h-1.5 rounded-full transition-all duration-500 ease-lux ${i === current ? 'w-6 bg-forest' : 'w-1.5 bg-forest/25'}`}
          />
        ))}
      </div>
    </div>
  )
}
