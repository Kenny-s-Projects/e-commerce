import { useMemo, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import ProductSingle from '../../components/ProductSingle/ProductSingle.jsx'
import FilterPanel from '../../components/maison/FilterPanel.jsx'
import { maisons, optionsOf } from '../../data/maisons.js'
import { formatPrice, maisonHref } from '../../data/houses.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

// Place des produits flottants autour du logo : left/top en %, largeur en px, profondeur (parallaxe)
const FLOATS = [
  { x: 5, y: 10, w: 170, d: 1 },
  { x: 10, y: 58, w: 200, d: 1.6, mobileHidden: true },
  { x: 24, y: 80, w: 110, d: 0.5, mobileHidden: true },
  { x: 73, y: 8, w: 190, d: 1.4 },
  { x: 86, y: 42, w: 140, d: 0.8, mobileHidden: true },
  { x: 74, y: 66, w: 170, d: 1.2 },
  { x: 30, y: 6, w: 110, d: 0.4, mobileHidden: true },
]

const SORTS = [
  ['selection', 'Sélection'],
  ['asc', 'Prix croissant'],
  ['desc', 'Prix décroissant'],
]

/**
 * Page Maison : hero animé, collections en chapitres, filtres collés en haut,
 * grille de 3 produits par ligne, respiration éditoriale, puis la Maison suivante.
 *  maison : configuration de data/maisons.js
 *  onAdd  : ajout au panier
 */
export default function Maison({ maison, onAdd }) {
  const t = useT()
  const [sel, setSel] = useState({}) // { brand: 'dior', cls: 'perfume' } …
  const [sort, setSort] = useState('selection')
  const gridRef = useRef(null)

  const list = useMemo(() => {
    const filtered = maison.products.filter((p) => Object.entries(sel).every(([k, v]) => !v || p[k] === v))
    if (sort === 'asc') return [...filtered].sort((a, b) => a.price - b.price)
    if (sort === 'desc') return [...filtered].sort((a, b) => b.price - a.price)
    return filtered
  }, [maison.products, sel, sort])

  const pristine = !Object.values(sel).some(Boolean) && sort === 'selection'
  const first = pristine ? list.slice(0, 6) : list
  const rest = pristine ? list.slice(6) : []

  const pick = (key, id, scroll) => {
    setSel((s) => ({ ...s, [key]: s[key] === id ? null : id }))
    if (scroll) gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const next = maisons[maison.next]
  const chapters = maison.filters[0]

  return (
    <div className={maison.bodyClass}>
      <MaisonHero maison={maison} onBrowse={() => gridRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      {/* Collections en chapitres */}
      <section className="px-gutter pt-[clamp(72px,9vw,130px)] pb-[clamp(40px,5vw,72px)]">
        <motion.div
          className="mb-[clamp(32px,4vw,52px)] flex items-end justify-between gap-6 max-sm:flex-col max-sm:items-start"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease }}
        >
          <h2 className="text-[clamp(36px,4.6vw,64px)] font-light leading-[1.05] tracking-[-0.015em]">
            {t('Les')} <span className="accent text-[1.08em]">{t(chapters.label).toLowerCase()}</span>
          </h2>
          <p className="max-w-[360px] text-sm leading-[1.75] opacity-80">
            {t('{n} produits, {m} {label}.', { n: maison.products.length, m: chapters.options.length, label: t(chapters.label).toLowerCase() })}
          </p>
        </motion.div>

        <motion.div
          className="flex gap-[clamp(12px,1.4vw,20px)] overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          {optionsOf(maison, chapters).map((o) => {
            const on = sel[chapters.key] === o.id
            return (
              <motion.button
                key={o.id}
                type="button"
                onClick={() => pick(chapters.key, o.id, true)}
                aria-pressed={on}
                className="group flex min-w-[150px] flex-1 flex-col gap-3 text-left"
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
                }}
              >
                <span
                  className={`relative block aspect-[3/4] w-full overflow-hidden bg-(--card) outline-offset-4 transition-[outline-color] duration-400 ${
                    maison.id === 'patchi' ? 'rounded-2xl' : ''
                  } ${on ? 'outline-2 outline-current' : 'outline-2 outline-transparent'}`}
                >
                  {o.img && (
                    <img
                      src={o.img}
                      alt=""
                      className={`absolute inset-0 m-auto transition-transform duration-700 ease-lux group-hover:scale-105 ${
                        o.boxed ? 'size-full object-cover' : 'size-[76%] object-contain mix-blend-multiply'
                      }`}
                    />
                  )}
                </span>
                <span className="accent text-[clamp(20px,1.8vw,26px)] leading-tight">{t(o.label)}</span>
                <span className="caps -mt-1.5 text-[9px] opacity-70">{t(o.count > 1 ? '{n} produits' : '{n} produit', { n: o.count })}</span>
              </motion.button>
            )
          })}
        </motion.div>
      </section>

      {/* Filtres, collés sous la barre */}
      <div ref={gridRef} className={`sticky top-16 z-30 border-y border-current/15 ${maison.bodyClass}`} id="grille">
        <FilterPanel
          id={`filtres-${maison.id}`}
          activeCount={Object.values(sel).filter(Boolean).length}
          total={list.length}
          onClear={() => setSel({})}
          round={maison.id === 'patchi'}
          sort={
            <label className="flex items-center gap-2 text-[12px]">
              <span className="opacity-80 max-sm:sr-only">{t('Trier')}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`h-9 border border-current/25 bg-transparent px-3 text-[12px] ${maison.id === 'patchi' ? 'rounded-full' : ''}`}
              >
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>{t(l)}</option>
                ))}
              </select>
            </label>
          }
        >
          {maison.filters.map((g, gi) => (
            <div key={g.key} className={`flex flex-wrap items-center gap-2 ${gi > 0 ? 'border-l border-current/15 pl-6 max-md:border-0 max-md:pl-0' : ''}`}>
              <span className="caps w-full opacity-70 md:hidden">{t(g.label)}</span>
              {optionsOf(maison, g).map((o) => {
                const on = sel[g.key] === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => pick(g.key, o.id)}
                    className={`h-9 border px-4 text-[12px] transition-colors duration-300 ${
                      maison.id === 'patchi' ? 'rounded-full' : ''
                    } ${on ? 'border-current bg-(--fg) text-(--card)' : 'border-current/25 hover:border-current'}`}
                  >
                    {t(o.label)}
                  </button>
                )
              })}
            </div>
          ))}
        </FilterPanel>
      </div>

      {/* Grille, 3 par ligne */}
      <ProductGrid items={first} maison={maison} onAdd={onAdd} />

      {pristine && <Edito maison={maison} />}

      {rest.length > 0 && <ProductGrid items={rest} maison={maison} onAdd={onAdd} />}

      {/* Maison suivante */}
      <a href={maisonHref(next.id)} className={`group block px-gutter py-[clamp(72px,9vw,120px)] ${next.heroClass}`}>
        <div className="flex items-center justify-between gap-8 max-sm:flex-col max-sm:items-start">
          <div>
            <p className="caps mb-5 opacity-80">{t('Maison suivante')}</p>
            <p className="text-[clamp(44px,6.4vw,96px)] font-light leading-none tracking-[-0.03em]">
              {t('Continuer chez')} <span className="accent text-[1.06em] inline-block pr-[0.1em]">{next.name}</span>
            </p>
          </div>
          <span aria-hidden className="text-[clamp(32px,4vw,56px)] transition-transform duration-500 ease-lux group-hover:translate-x-3">
            ⟶
          </span>
        </div>
      </a>
    </div>
  )
}

/* ---------- Hero : les produits en apesanteur autour du logo ---------- */
function MaisonHero({ maison, onBrowse }) {
  const t = useT()
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 50, damping: 18 })
  const sy = useSpring(my, { stiffness: 50, damping: 18 })

  const floats = maison.floats
    .map((id) => maison.products.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, FLOATS.length)

  const onMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <section
      onMouseMove={onMove}
      className={`relative h-[calc(100svh-4rem)] min-h-[620px] overflow-hidden [--fs:1] max-md:min-h-[560px] max-md:[--fs:0.56] ${maison.heroClass}`}
    >
      {floats.map((p, i) => (
        <FloatItem key={p.id} product={p} spot={FLOATS[i]} index={i} sx={sx} sy={sy} reduce={reduce} maison={maison} onBrowse={onBrowse} />
      ))}

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease }}
        >
          {maison.logo ? (
            <img src={maison.logo} alt={maison.name} className={maison.logoClass ?? 'mx-auto h-auto w-[clamp(170px,20vw,290px)]'} />
          ) : (
            <h1 className="text-[clamp(110px,15vw,230px)] font-light leading-[0.8] tracking-[-0.04em]">{maison.wordmark}</h1>
          )}
        </motion.div>
        <motion.p
          className="mt-[clamp(24px,3vw,40px)] text-[clamp(22px,2.4vw,34px)] font-light leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease }}
        >
          {t(maison.title)} <span className="accent text-[1.08em]">{t(maison.accent)}</span>
        </motion.p>
        <motion.p
          className="mt-3 max-w-[520px] text-[14px] leading-[1.7]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease }}
        >
          {t(maison.story)}
        </motion.p>
      </div>

      <button
        type="button"
        onClick={onBrowse}
        className="caps absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2.5"
      >
        {t('Voir les produits')}
        <span className="block h-9 w-px overflow-hidden bg-current/30">
          <span className="block h-1/3 w-full animate-scroll-cue bg-current" />
        </span>
      </button>
    </section>
  )
}

function FloatItem({ product, spot, index, sx, sy, reduce, maison, onBrowse }) {
  const [hover, setHover] = useState(false)
  const x = useTransform(sx, (v) => v * -34 * spot.d)
  const y = useTransform(sy, (v) => v * -26 * spot.d)

  return (
    <motion.div
      className={`absolute ${spot.mobileHidden ? 'max-md:hidden' : ''}`}
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `calc(${spot.w}px * var(--fs))`, x, y, zIndex: hover ? 30 : Math.round(spot.d * 4) }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: spot.d < 0.6 ? 0.85 : 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.3 + index * 0.08, ease }}
    >
      <motion.button
        type="button"
        onClick={onBrowse}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-label={`${product.name}, ${formatPrice(product.price, product.unit)}`}
        className={`block w-full p-2.5 text-left text-current shadow-[0_30px_60px_rgba(0,0,0,0.16)] ${maison.floatClass}`}
        animate={reduce ? {} : { y: [0, -14, 0] }}
        transition={{ duration: 5 + index * 0.7, delay: index * 0.45, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.05 }}
      >
        <span className={`relative block aspect-square overflow-hidden ${maison.id === 'patchi' ? 'rounded-xl' : 'bg-white'}`}>
          <img
            src={product.img}
            alt=""
            className={`absolute inset-0 m-auto ${product.boxed ? 'size-full object-cover' : 'size-[82%] object-contain mix-blend-multiply'}`}
          />
        </span>
        <AnimatePresence>
          {hover && (
            <motion.span
              className="block overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease }}
            >
              <span className="block px-1 pt-2.5 text-[12px] font-medium leading-snug">{product.name}</span>
              <span className="block px-1 pt-0.5 pb-1 text-[12px]">{formatPrice(product.price, product.unit)}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

/* ---------- Grille de produits, 3 par ligne ---------- */
function ProductGrid({ items, maison, onAdd }) {
  const t = useT()
  return (
    <section className="px-gutter py-[clamp(48px,6vw,88px)]">
      <motion.div layout className="grid grid-cols-3 gap-x-[clamp(16px,2.2vw,32px)] gap-y-[clamp(40px,4.5vw,64px)] max-[900px]:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {items.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
              transition={{ duration: 0.7, ease }}
            >
              <ProductSingle product={{ ...p, house: { id: maison.id, name: maison.name } }} onAdd={onAdd} href={`#maison/${maison.id}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {items.length === 0 && <p className="py-10 text-sm opacity-70">{t('Aucun produit pour ces filtres.')}</p>}
    </section>
  )
}

/* ---------- Respiration éditoriale entre deux rangées ---------- */
function Edito({ maison }) {
  const t = useT()
  const e = maison.edito
  return (
    <section className={`px-gutter py-[clamp(64px,8vw,110px)] ${e.bg}`}>
      <div className="grid grid-cols-2 items-center gap-[clamp(32px,6vw,96px)] max-md:grid-cols-1">
        <motion.div
          className={`relative aspect-[4/3] overflow-hidden ${e.boxed ? 'rounded-3xl' : 'bg-kyra-card'}`}
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease }}
        >
          <img src={e.img} alt="" className={`absolute inset-0 m-auto ${e.boxed ? 'size-full object-cover' : 'size-[70%] object-contain mix-blend-multiply'}`} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, delay: 0.15, ease }}
        >
          <p className="caps mb-6 opacity-80">{t(e.eyebrow)}</p>
          <p className="text-[clamp(34px,4vw,56px)] font-light leading-[1.12]">
            {t(e.title)} <span className="accent text-[1.08em] inline-block pr-[0.1em]">{t(e.accent)}</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
