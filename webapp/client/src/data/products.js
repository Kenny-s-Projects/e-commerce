// Index de tous les produits des 4 Maisons, pour la fiche produit, l'aperçu rapide,
// la recherche et la page Offrir. Les catalogues restent dans catalog.js.
import { kyraCatalog, patchiCatalog, adidasCatalog, celioCatalog } from './catalog.js'

export const MAISONS = {
  kyra: { id: 'kyra', name: 'Kyra' },
  patchi: { id: 'patchi', name: 'Patchi' },
  adidas: { id: 'adidas', name: 'adidas' },
  celio: { id: 'celio', name: 'Celio' },
}

// Vraies photos Patchi (public/img/products/patchi), par référence produit.
// Les produits absents de cette liste gardent le visuel provisoire.
const P = '/img/products/patchi'
const PATCHI_PHOTOS = {
  ccd01: [
    `${P}/Chocolate Milk Filled with Praline/Product2.webp`,
    `${P}/Chocolate Milk Filled with Praline/Chocolate Milk Filled with Praline.webp`,
    `${P}/Chocolate Milk Filled with Praline/Chocolate Milk Filled with Praline 3.webp`,
    `${P}/Chocolate Milk Filled with Praline/Chocolate Milk Filled with Praline 4.webp`,
  ],
  gbr0002: [`${P}/Chocolate Bar 100 g Noblesse/Product1.webp`, `${P}/Chocolate Bar 100 g Noblesse/Offert.webp`],
  gns0013: [
    `${P}/Dragée Diet Almond Milk/Product3.webp`,
    `${P}/Dragée Diet Almond Milk/Dragée Diet Almond Milk, 250 g 1.webp`,
    `${P}/Dragée Diet Almond Milk/Dragée Diet Almond Milk, 250 g 2.webp`,
  ],
  ggf0005: [`${P}/Filled Chocolate Box 1025 g/Product4.avif`, `${P}/Filled Chocolate Box 1025 g/Filled Chocolate Box 1025 g 2.avif`],
}

const withMaison = (list, maison) =>
  list.map((p) => {
    const photos = maison === 'patchi' ? PATCHI_PHOTOS[p.id] : null
    return {
      ...p,
      ...(photos ? { img: photos[0], images: photos } : {}),
      maison,
      house: MAISONS[maison],
    }
  })

export const allProducts = [
  ...withMaison(kyraCatalog, 'kyra'),
  ...withMaison(patchiCatalog, 'patchi'),
  ...withMaison(adidasCatalog, 'adidas'),
  ...withMaison(celioCatalog, 'celio'),
]

const byId = new Map(allProducts.map((p) => [p.id, p]))

export const getProduct = (id) => byId.get(id) ?? null

// Lien vers la fiche produit (null si le produit n'a pas de fiche, ex. produits fictifs de l'accueil)
export const productHref = (id) => (byId.has(id) ? `#produit/${id}` : null)

// Toutes les photos d'un produit
export const productGallery = (p) => p.images ?? (p.img ? [p.img] : [])

// 4 produits de la même Maison, la même collection d'abord
export const relatedProducts = (p, n = 4) => {
  const same = allProducts.filter((x) => x.maison === p.maison && x.id !== p.id)
  const key = p.cat ?? p.brand
  const first = same.filter((x) => (x.cat ?? x.brand) === key)
  const rest = same.filter((x) => (x.cat ?? x.brand) !== key)
  return [...first, ...rest].slice(0, n)
}

// Poids proposés pour les produits vendus au kilo (Patchi Deluxe et Classiques)
export const WEIGHTS = [
  { label: '250 g', kg: 0.25 },
  { label: '500 g', kg: 0.5 },
  { label: '1 kg', kg: 1 },
]

// Message WhatsApp prérempli pour le concierge
export const whatsappFor = (text) => `https://wa.me/243856486993?text=${encodeURIComponent(text)}`
