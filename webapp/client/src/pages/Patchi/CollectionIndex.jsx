import { useEffect, useState } from 'react'
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

/**
 * Index des collections : grands titres en italique, numérotés.
 * Animations : les filets se dessinent un à un ; au survol, la ligne glisse
 * et la vignette de la collection survolée suit la souris (ordinateur) ; d'une collection
 * à l'autre, l'image change en fondu.
 *  collections : [{ id, label, note }] · counts : { id: n } · onPick(id)
 *  loading     : catalogue en cours de chargement → lignes squelettes à la place des chapitres
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

      <div className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
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
