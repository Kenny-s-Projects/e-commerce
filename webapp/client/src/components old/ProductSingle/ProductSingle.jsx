import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatPrice } from '../../data/houses.js'

/**
 * Carte produit : Image + Store + Name + Price + CTA.
 *  product : { id, store, name, price, unit?, img, boxed? }
 *            boxed = visuel carré plein (Patchi), sinon photo détourée
 *  onAdd   : appelé au clic sur "Ajouter"
 *
 * Les couleurs suivent la section : fond de carte = var(--card), texte = var(--fg).
 */
export default function ProductSingle({ product, onAdd }) {
  const [loaded, setLoaded] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAdd?.(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="group flex flex-col">
      {/* Image */}
      <a
        href={`#produit/${product.id}`}
        className="relative mb-[18px] grid aspect-[4/5] place-items-center overflow-hidden bg-(--card)"
      >
        {product.img ? (
          <motion.img
            src={product.img}
            alt={product.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            initial={{ opacity: 0 }}
            animate={loaded ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 m-auto transition-transform duration-[1100ms] ease-lux group-hover:scale-106 ${
              product.boxed
                ? 'aspect-square w-[78%] object-cover'
                : 'size-[78%] object-contain mix-blend-multiply'
            }`}
          />
        ) : (
          <span className="caps text-[8px] opacity-50">Photo à venir</span>
        )}
      </a>

      {/* Store + Name */}
      <p className="caps text-[9px] opacity-60">{product.store}</p>
      <h3 className="mt-1.5 text-sm font-normal">{product.name}</h3>

      {/* Price + CTA */}
      <div className="mt-[18px] flex items-center justify-between">
        <span className="text-sm">{formatPrice(product.price, product.unit)}</span>
        <button
          onClick={handleAdd}
          className={`caps relative z-0 overflow-hidden border px-4 py-2.5 text-[9px] transition-colors duration-400 ease-lux
            before:absolute before:inset-0 before:-z-10 before:bg-(--fg) before:transition-transform before:duration-[450ms] before:ease-lux
            hover:border-current hover:text-(--card) hover:before:translate-y-0
            ${added ? 'border-current text-(--card) before:translate-y-0' : 'border-current/35 before:translate-y-[101%]'}`}
        >
          <span className="relative">{added ? 'Ajouté' : 'Ajouter'}</span>
        </button>
      </div>
    </article>
  )
}
