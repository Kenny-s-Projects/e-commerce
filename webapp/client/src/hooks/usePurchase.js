import { useRef, useState } from 'react'
import { whatsappFor } from '../data/products.js'
import { formatPrice } from '../data/houses.js'
import { cartLine, defaultVariant, isPurchasable } from '../data/live.js'
import { flyToCart } from '../components/FlyToCart/flyToCart.js'

/**
 * Logique d'achat d'un produit, partagée par la fiche produit et l'aperçu rapide :
 * variante (poids 250 g / 500 g / 1 kg pour les produits au kilo), quantité, mot cadeau, ajout au panier.
 *  product : produit du catalogue réel (data/live.js) ou fiche du site (« Bientôt disponible »)
 *  onAdd   : ajout au panier (ligne, quantité)
 *
 * Seuls les produits du catalogue réel, d'une Maison ouverte et en stock, peuvent être achetés.
 */
export default function usePurchase(product, onAdd) {
  const variants = product.live ? product.variants : []
  const byWeight = Boolean(product.byWeight && variants.length > 1)
  const first = defaultVariant(product)
  const [variantId, setVariantId] = useState(first?.id ?? null)
  const [qty, setQty] = useState(1)
  const [gift, setGift] = useState(false)
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)

  const variant = variants.find((v) => v.id === variantId) ?? first
  const comingSoon = !product.live || product.comingSoon
  const available = isPurchasable(product) && Boolean(variant?.available)
  const unitPrice = variant?.price ?? (product.live ? null : product.price ?? null)
  const total = unitPrice == null ? null : Math.round(unitPrice * qty * 100) / 100
  // Stock à la pièce : on ne propose pas plus que ce qui reste
  const maxQty = !product.byWeight && variant?.stock ? variant.stock : 50

  const line = variant ? cartLine(product, variant, gift ? note : '') : null

  // Ajout au panier : un seul ajout par geste (clics répétés ignorés pendant l'animation),
  // puis la photo du produit « vole » vers le panier (depuis la galerie si elle est à l'écran, sinon depuis le bouton)
  const lock = useRef(false)
  const add = (event) => {
    if (!available || !line || lock.current) return
    lock.current = true
    onAdd?.(line, qty)
    const button = event?.currentTarget
    const origin = button?.closest?.('[data-fly-scope]')?.querySelector('[data-fly-origin]')
    const r = origin?.getBoundingClientRect()
    const visible = r && r.bottom > 0 && r.top < window.innerHeight
    flyToCart({ from: visible ? origin : button, src: product.images?.[0] ?? product.img })
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      lock.current = false
    }, 1800)
  }

  // « Commander maintenant » : uniquement cet article, directement vers la page de commande
  const buyNow = (onBuyNow) => {
    if (!available || !line) return
    onBuyNow?.(line, qty)
  }

  const whatsapp = whatsappFor(
    `Bonjour, je souhaite commander : ${qty} × ${product.name}${variant && byWeight ? ` (${variant.label})` : ''}` +
      `${unitPrice != null ? ` à ${formatPrice(unitPrice)}` : ''} chez ${product.house?.name ?? ''}.`,
  )

  return {
    byWeight,
    variants,
    variant,
    setVariant: setVariantId,
    qty,
    setQty: (n) => setQty(Math.min(maxQty, Math.max(1, n))),
    gift, setGift, note, setNote,
    unitPrice, total, available, comingSoon, added, add, buyNow, whatsapp,
  }
}
