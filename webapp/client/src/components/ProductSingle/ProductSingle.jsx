import { useState } from 'react'
import ProductMedia from '../ProductMedia/ProductMedia.jsx'
import { formatPrice, productImages } from '../../data/houses.js'

/**
 * Carte produit : Image + Store + Name + Price + CTA.
 *  product : { id, store, name, price, unit?, img | images, boxed? }
 *            boxed = visuel carré (Patchi), sinon photo détourée
 *  onAdd   : appelé au clic sur "Ajouter"
 *
 * Image : changement au survol (ordinateur), défilement au doigt + barre (mobile) → voir ProductMedia.
 * Les couleurs suivent la section : fond de carte = var(--card), texte = var(--fg).
 */
export default function ProductSingle({ product, onAdd }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAdd?.(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="group flex flex-col">
      {/* Image */}
      <ProductMedia
        images={productImages(product)}
        fit={product.boxed ? 'boxed' : 'contain'}
        alt={product.name}
        href={`#produit/${product.id}`}
        className="mb-[18px] aspect-[4/5] bg-(--card)"
      />

      {/* Store + Name */}
      <p className="caps text-[9px] opacity-60">{product.store}</p>
      <h3 className="mt-1.5 text-sm font-normal">{product.name}</h3>

      {/* Price + CTA */}
      <div className="mt-[18px] flex items-center justify-between gap-3">
        <span className="text-sm">{formatPrice(product.price, product.unit)}</span>
        <button
          onClick={handleAdd}
          className={`caps relative z-0 shrink-0 overflow-hidden border px-4 py-2.5 text-[9px] transition-colors duration-400 ease-lux
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
