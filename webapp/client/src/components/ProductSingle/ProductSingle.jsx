import { useRef, useState } from 'react'
import ProductMedia from '../ProductMedia/ProductMedia.jsx'
import { formatPrice, productImages } from '../../data/houses.js'
import { getProduct, productHref } from '../../data/products.js'
import { cartLine, defaultVariant, isPurchasable, useLive } from '../../data/live.js'
import { useQuickView } from '../../context/quickView.js'
import { useT } from '../../i18n/lang.js'
import { flyToCart } from '../FlyToCart/flyToCart.js'

/**
 * Carte produit : Image + Store + Name + Price + CTA.
 *  product : { id, store, name, price, unit?, img | images, boxed? }
 *            boxed = visuel carré (Patchi), sinon photo détourée
 *  onAdd   : appelé au clic sur "Ajouter"
 *
 * Image : changement au survol (ordinateur), défilement au doigt + barre (mobile) → voir ProductMedia.
 * Les couleurs suivent la section : fond de carte = var(--card), texte = var(--fg).
 * Un clic sur l'image ouvre la fiche produit (#produit/<id>) ; « Aperçu » ouvre la popup d'aperçu rapide.
 *  href : lien de repli pour les produits sans fiche (produits fictifs de l'accueil)
 */
export default function ProductSingle({ product, onAdd, href = '#' }) {
  const t = useT()
  useLive() // se met à jour quand le catalogue réel arrive ou qu'une Maison s'ouvre
  const [added, setAdded] = useState(false)
  const openQuickView = useQuickView()
  // Version complète du produit (Maison, vraies photos Patchi) quand il a une fiche
  const full = getProduct(product.id)
  const item = full ?? product
  // Seuls les produits du catalogue réel d'une Maison ouverte sont achetables ; les autres : « Bientôt disponible »
  const available = isPurchasable(item)
  const variant = available ? defaultVariant(item) : null
  const images = full?.images ?? productImages(product)
  const fit = full?.live ? (full.hasPhoto ? 'bleed' : 'boxed') : full?.images ? 'bleed' : product.boxed ? 'boxed' : 'contain'

  // Un seul ajout par geste : les clics répétés pendant l'animation sont ignorés
  const lock = useRef(false)
  const media = useRef(null)
  const handleAdd = () => {
    if (!variant || lock.current) return
    lock.current = true
    onAdd?.(cartLine(item, variant), 1)
    flyToCart({ from: media.current, src: images[0] })
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      lock.current = false
    }, 1600)
  }

  return (
    <article className="group flex flex-col">
      {/* Image + bouton Aperçu (apparaît au survol sur ordinateur) */}
      <div ref={media} className="relative mb-[18px]">
        <ProductMedia
          images={images}
          fit={fit}
          alt={product.name}
          href={productHref(product.id) ?? href}
          className="aspect-[4/5] bg-(--card)"
        />
        {full && (
          <button
            type="button"
            onClick={() => openQuickView(full)}
            className="caps absolute right-3 top-3 rounded-full bg-white/90 px-3.5 py-2 text-[9px] text-ink shadow-sm transition-all duration-500 ease-lux hover:bg-ink hover:text-white
              [@media(hover:hover)]:-translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:none)]:hidden"
          >
            {t('Aperçu')}
          </button>
        )}
      </div>

      {/* Store + Name */}
      <p className="caps text-[9px] opacity-60">{t(product.store)}</p>
      <h3 className="mt-1.5 text-sm font-normal">{t(product.name)}</h3>

      {/* Price + CTA */}
      <div className="mt-[18px] flex items-center justify-between gap-3">
        <span className="text-sm">
          {item.live && item.price != null
            ? `${item.byWeight ? `${t('dès')} ` : ''}${formatPrice(item.price)}`
            : item.live
              ? t('Prix à venir')
              : t('Bientôt disponible')}
        </span>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!available}
          aria-label={available ? t('Ajouter {p} au panier', { p: t(product.name) }) : undefined}
          className={`caps relative z-0 shrink-0 overflow-hidden border px-4 py-2.5 text-[9px] transition-colors duration-400 ease-lux
            before:absolute before:inset-0 before:-z-10 before:bg-(--fg) before:transition-transform before:duration-[450ms] before:ease-lux
            hover:border-current hover:text-(--card) hover:before:translate-y-0
            ${added ? 'border-current text-(--card) before:translate-y-0' : 'border-current/35 before:translate-y-[101%]'}
            disabled:pointer-events-none disabled:opacity-50`}
        >
          <span className="relative">{t(!available ? (item.live && !item.comingSoon ? 'Épuisé' : 'Bientôt') : added ? 'Ajouté' : 'Ajouter')}</span>
        </button>
      </div>
    </article>
  )
}
