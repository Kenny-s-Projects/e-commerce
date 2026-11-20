import { useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { photoFit } from './theme.js'
import { useT } from '../../i18n/lang.js'
import { formatPrice } from '../../data/houses.js'

const ease = [0.22, 1, 0.36, 1]

// Classe de texte d'un thème plein (ex. 'bg-black text-white' → 'text-white')
const textOf = (solid) => solid.split(' ').find((c) => c.startsWith('text-')) ?? ''

/**
 * Choix de la variante (produits au kilo : 250 g, 500 g, 1 kg) : chaque option affiche son prix.
 *  variants : [{ id, label, price, available }] · value : id choisi
 */
export function WeightPicker({ variants, value, onChange, solid, compact = false }) {
  const t = useT()
  return (
    <div>
      <p className="caps mb-2.5">{t('Poids')}</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('Poids')}>
        {variants.map((v) => {
          const on = v.id === value
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!v.available}
              onClick={() => onChange(v.id)}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl border disabled:cursor-not-allowed disabled:opacity-40 ${compact ? 'py-2.5' : 'py-3'} ${on ? 'border-transparent' : 'border-current/25 hover:border-current'}`}
            >
              {on && <m.span layoutId={`weight-${compact ? 'qv' : 'page'}`} className={`absolute inset-[-1px] rounded-xl ${solid}`} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className={`relative text-[15px] ${on ? textOf(solid) : ''}`}>{v.label}</span>
              {!compact && (
                <span className={`relative text-[11px] opacity-75 ${on ? textOf(solid) : ''}`}>
                  {v.available ? formatPrice(v.price) : t('Épuisé')}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * − 1 + (quantité)
 */
export function QtyStepper({ value, onChange }) {
  const t = useT()
  return (
    <div className="flex h-[54px] items-center rounded-full border border-current/30">
      <button type="button" aria-label={t('Moins')} onClick={() => onChange(value - 1)} className="grid h-full w-11 place-items-center text-lg">−</button>
      <span className="w-6 text-center tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label={t('Plus')} onClick={() => onChange(value + 1)} className="grid h-full w-11 place-items-center text-lg">+</button>
    </div>
  )
}

/**
 * Galerie : vignettes + grande image (fondu d'une photo à l'autre, zoom au survol qui suit la souris).
 *  layout : 'side' (vignettes à gauche, ordinateur) | 'below' (vignettes dessous, aperçu rapide et mobile)
 */
export function Gallery({ product, photos, tone, layout = 'side', rounded = 'rounded-2xl' }) {
  const t = useT()
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(null) // position de la souris en % pour le zoom
  const fit = photoFit(product)
  const src = photos[index]

  const main = (
    <div
      className={`relative aspect-square overflow-hidden ${rounded} ${tone}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
      }}
      onMouseLeave={() => setZoom(null)}
    >
      {src ? (
        <AnimatePresence mode="popLayout" initial={false}>
          <m.img
            key={src}
            src={src}
            alt={product.name}
            className={`absolute inset-0 m-auto transition-transform duration-500 ease-lux ${fit}`}
            style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease }}
          />
        </AnimatePresence>
      ) : (
        <span className="caps absolute inset-0 grid place-items-center text-[9px] opacity-60">{t('Photo à venir')}</span>
      )}
      {photos.length > 1 && (
        <span className="caps absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1.5 text-[9px] text-ink">
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </span>
      )}
    </div>
  )

  if (photos.length <= 1) return main

  const thumbs = photos.map((p, i) => (
    <button
      key={p}
      type="button"
      onClick={() => setIndex(i)}
      aria-label={`${t('Photo')} ${i + 1}`}
      aria-pressed={i === index}
      className={`relative aspect-square shrink-0 overflow-hidden rounded-lg outline outline-1 outline-offset-[3px] transition-[opacity,outline-color] duration-300 ${tone} ${
        i === index ? 'opacity-100 outline-current' : 'opacity-60 outline-transparent hover:opacity-90'
      } ${layout === 'side' ? 'w-full max-md:w-16' : 'w-16'}`}
    >
      <img loading="lazy" decoding="async" src={p} alt="" className={`absolute inset-0 m-auto ${fit}`} />
    </button>
  ))

  return layout === 'side' ? (
    <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 max-md:grid-cols-1">
      <div className="flex flex-col gap-3 max-md:order-2 max-md:flex-row">{thumbs}</div>
      {main}
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      {main}
      <div className="flex gap-2.5">{thumbs}</div>
    </div>
  )
}
