// Les 4 Maisons. Chaque Maison a son fichier dans data/houses/ :
// textes de la home, catalogue complet (produits + collections) et réglages de sa page.
import kyra from './houses/kyra.js'
import patchi from './houses/patchi.js'
import adidas from './houses/adidas.js'
import celio from './houses/celio.js'

export const houses = [kyra, patchi, adidas, celio]

export const getHouse = (id) => houses.find((h) => h.id === id)

// Les 4 produits mis en avant sur la home
export const featuredProducts = (house) =>
  (house.featured ?? []).map((id) => house.products.find((p) => p.id === id)).filter(Boolean)

// Toutes les images d'un produit : `images` (plusieurs photos) ou `img` (une seule)
export const productImages = (product) => product.images ?? (product.img ? [product.img] : [])

// Retrouver un produit par son id, toutes Maisons confondues
export const findProduct = (id) => {
  for (const house of houses) {
    const product = house.products.find((p) => p.id === id)
    if (product) return { ...product, house }
  }
  return null
}

export const formatPrice = (price, unit) => {
  if (price == null) return '[Prix]'
  return unit ? `$${price} / ${unit}` : `$${price}`
}

// "5 kg en stock", "6 en stock", "Épuisé" ; rien si le stock n'est pas connu
export const formatStock = (stock, unit) => {
  if (stock == null) return null
  if (stock === 0) return 'Épuisé'
  return `${stock}${unit ? ` ${unit}` : ''} en stock`
}
