import { useState } from 'react'
import ProductMedia from '../ProductMedia/ProductMedia.jsx'
import HouseMark from '../HouseMark/HouseMark.jsx'
import { formatPrice, formatStock, productImages } from '../../data/houses.js'

/**
 * Carte produit de la page Maison (grille 3 par ligne) :
 * Image (galerie au survol / au doigt) + bouton « Ajouter » sur l'image
 * + Collection + Nom + Prix + Stock.
 *  product : produit de la Maison
 *  house   : la Maison (couleurs, forme des coins, logo de remplacement)
 *  onAdd   : clic sur « Ajouter »
 */
export default function ShopCard({ product, house, onAdd }) {
  const { shop } = house
  const [added, setAdded] = useState(false)
  const stock = formatStock(product.stock, product.unit)

  const handleAdd = () => {
    onAdd?.(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="group">
      <div className="relative mb-4">
        <ProductMedia
          images={productImages(product)}
          fit={product.img ? shop.fit : 'contain'}
          alt={product.name}
          href={`#produit/${product.id}`}
          className={`aspect-square ${shop.radius} ${shop.colors.card}`}
          placeholder={
            <span className="flex flex-col items-center gap-3 opacity-60">
              <HouseMark house={house} onLight className="h-8" textClass="text-3xl" />
              <span className="caps text-[8px]">Photo à venir</span>
            </span>
          }
        />

        {/* Ajout rapide : apparaît au survol sur ordinateur, toujours visible sur mobile */}
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Ajouter ${product.name} au panier`}
          className={`caps absolute bottom-3 right-3 rounded-full px-4 py-2 text-[9px] [@media(hover:none)]:grid [@media(hover:none)]:size-9 [@media(hover:none)]:place-items-center [@media(hover:none)]:p-0 [@media(hover:none)]:text-base shadow-sm backdrop-blur-sm transition-all duration-500 ease-lux
            ${added ? 'bg-ink text-white' : 'bg-white/85 text-ink hover:bg-ink hover:text-white'}
            [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0
            [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100
            ${added ? '[@media(hover:hover)]:translate-y-0 [@media(hover:hover)]:opacity-100' : ''}`}
        >
          {/* Ordinateur : texte ; mobile : simple « + » rond pour ne pas cacher la galerie */}
          <span className="[@media(hover:none)]:hidden">{added ? 'Ajouté ✓' : 'Ajouter +'}</span>
          <span aria-hidden className="hidden leading-none [@media(hover:none)]:inline">{added ? '✓' : '+'}</span>
        </button>
      </div>

      <p className="text-[10px] opacity-70">{product.store}</p>
      <h3 className="mt-1 text-sm font-normal leading-snug">{product.name}</h3>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{formatPrice(product.price, product.unit)}</span>
        {stock && <span className="text-[10px] opacity-60">{stock}</span>}
      </div>
    </article>
  )
}
