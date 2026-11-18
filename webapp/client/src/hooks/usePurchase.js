import { useState } from 'react'
import { WEIGHTS, whatsappFor } from '../data/products.js'
import { formatPrice } from '../data/houses.js'

/**
 * Logique d'achat d'un produit, partagée par la fiche produit et l'aperçu rapide :
 * poids (produits au kilo), quantité, mot cadeau, ajout au panier, lien WhatsApp.
 *  product : produit de data/products.js
 *  onAdd   : ajout au panier (une unité à chaque appel)
 */
export default function usePurchase(product, onAdd) {
  const byWeight = product.unit === 'kg'
  const [weight, setWeight] = useState(0)
  const [qty, setQty] = useState(1)
  const [gift, setGift] = useState(false)
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)

  const w = WEIGHTS[weight]
  const unitPrice = product.price == null ? null : byWeight ? Math.round(product.price * w.kg) : product.price
  const total = unitPrice == null ? null : unitPrice * qty
  const available = unitPrice != null

  // Ligne de panier : une variante par poids, le mot cadeau dans le nom
  const line = {
    ...product,
    id: byWeight ? `${product.id}-${w.label.replace(/\s/g, '')}` : product.id,
    name: `${product.name}${byWeight ? ` · ${w.label}` : ''}${gift && note.trim() ? ` · Carte : « ${note.trim()} »` : ''}`,
    price: unitPrice,
    unit: null,
  }

  const add = () => {
    if (!available) return
    for (let i = 0; i < qty; i++) onAdd?.(line)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  // « Commander maintenant » : uniquement cet article, directement vers la page de commande
  const buyNow = (onBuyNow) => {
    if (!available) return
    onBuyNow?.(line, qty)
  }

  const whatsapp = whatsappFor(
    `Bonjour, je souhaite commander : ${qty} × ${product.name}${byWeight ? ` (${w.label})` : ''}` +
      `${available ? ` à ${formatPrice(unitPrice)}` : ''} chez ${product.house.name}.`
  )

  return {
    byWeight, weights: WEIGHTS, weight, setWeight,
    qty, setQty: (n) => setQty(Math.max(1, n)),
    gift, setGift, note, setNote,
    unitPrice, total, available, added, add, buyNow, whatsapp,
  }
}
