import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatPrice } from '../../data/houses.js'
import './ProductSingle.css'

/**
 * Carte produit : Image + Store + Name + Price + CTA.
 *  product : { id, store, name, price, img }
 *  onAdd   : appelé au clic sur "Ajouter"
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
    <article className="product">
      <a href={`#produit/${product.id}`} className="product__media">
        {product.img ? (
          <motion.img
            src={product.img}
            alt={product.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            initial={{ opacity: 0 }}
            animate={loaded ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : (
          <div className="product__placeholder caps">Photo à venir</div>
        )}
      </a>

      <p className="product__store caps">{product.store}</p>
      <h3 className="product__name">{product.name}</h3>

      <div className="product__foot">
        <span className="product__price">{formatPrice(product.price)}</span>
        <button className={`product__cta caps ${added ? 'is-added' : ''}`} onClick={handleAdd}>
          {added ? 'Ajouté' : 'Ajouter'}
        </button>
      </div>
    </article>
  )
}