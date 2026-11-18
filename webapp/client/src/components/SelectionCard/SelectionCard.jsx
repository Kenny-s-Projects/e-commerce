import ProductMedia from '../ProductMedia/ProductMedia.jsx'
import { productHref } from '../../data/products.js'
import { formatPrice, productImages, maisonHref } from '../../data/houses.js'
import { useT } from '../../i18n/lang.js'

/**
 * Grande carte de la Sélection : Image + Maison · Marque + Nom + Prix (sans bouton).
 *  product : produit enrichi de sa Maison (voir findProduct dans houses.js)
 *  tone    : classe de fond de l'image (ex. 'bg-green')
 */
export default function SelectionCard({ product, tone = 'bg-cream' }) {
  const t = useT()
  const { house } = product
  // "KYRA · HERMÈS" pour Kyra (Maison + marque), "PATCHI" seul sinon
  const origin = product.store && house.id === 'kyra' ? `${house.name} · ${t(product.store)}` : house.name

  return (
    <article className="group">
      <ProductMedia
        images={productImages(product)}
        fit={product.boxed ? 'bleed' : 'contain'}
        alt={product.name}
        href={productHref(product.id) ?? maisonHref(house.id)}
        className={`mb-5 aspect-[4/5] ${tone}`}
        swipe={false}
      />

      <p className="caps text-[9px] text-gold">{origin}</p>
      <div className="mt-1.5 flex items-baseline justify-between gap-4 text-sm">
        <h3 className="font-normal">{t(product.name)}</h3>
        <span className="shrink-0">{formatPrice(product.price, product.unit)}</span>
      </div>
    </article>
  )
}
