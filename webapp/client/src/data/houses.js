// Données fantômes : les 4 Maisons de la home.
// Produits Kyra repris de l'existant (app.js), Patchi de brands.js (ERP, oct. 2026).
// Images dans public/img.

const PATCHI_IMG = '/img/logos/patchi-placeholder.png'
const PATCHI_Product1 = '/img/products/patchi/Chocolate Bar 100 g Noblesse/Product1.webp' // visuel provisoire
const PATCHI_Product2 = '/img/products/patchi/Chocolate Milk Filled with Praline/Product2.webp' // visuel provisoire
const PATCHI_Product3 = '/img/products/patchi/Dragée Diet Almond Milk/Product3.webp' // visuel provisoire
const PATCHI_Product4 = '/img/products/patchi/Filled Chocolate Box 1025 g/Product4.avif' // visuel provisoire

const PATCHI_IMG_SECTION = '/img/logos/patchi-heroSection.png' // visuel provisoire
const KYRA_IMG_SECTION = '/img/logos/kyra-heroSection.png' // visuel provisoire

export const houses = [
  {
    id: 'kyra',
    name: 'kyra',
    logo: "/img/logos/logo-kyra.png", // pas de fichier logo : wordmark en texte
    theme: 'kyra',
    tagline: 'Parfums · Maquillage & soins',
    title: 'Les grandes maisons de',
    accent: 'beauté.',
    subtitle:
      'Chanel, Dior, Hermès, Tom Ford, blackUp, Calvin Klein et Versace : parfums, maquillage et soins.',
    hero: { img: KYRA_IMG_SECTION, name: 'Miss Dior Parfum', price: 78 },
    products: [
      { id: 'chanel-chance-eau-tendre', store: 'Chanel', name: 'Chance Eau Tendre', price: 100, img: '/img/chanel-chance-eau-tendre.webp' },
      { id: 'hermes-twilly-eau-ginger', store: 'Hermès', name: 'Twilly Eau Ginger', price: 96, img: '/img/hermes-twilly-eau-ginger.webp' },
      { id: 'tomford-black-orchid', store: 'Tom Ford', name: 'Black Orchid', price: 74, img: '/img/tomford-black-orchid.webp' },
      { id: 'versace-dylan-blue', store: 'Versace', name: 'Dylan Blue Pour Femme', price: 97, img: '/img/versace-dylan-blue.webp' },
    ],
  },
  {
    id: 'patchi',
    name: 'Patchi',
    logo: '/img/logos/patchi.png',
    theme: 'green',
    tagline: 'Chocolats & cadeaux',
    title: 'Le chocolat,',
    accent: 'l’art d’offrir.',
    accentInline: true, // titre sur une seule ligne, comme la maquette
    subtitle: 'Chocolats fins au poids, coffrets garnis, dragées et tablettes.',
    hero: { img: PATCHI_IMG_SECTION, name: 'Filled Chocolate Box 1025 g', price: 163, boxed: true },
    products: [
      { id: 'ccd01', ref: 'CCD01', store: 'Deluxe', name: 'Chocolate Milk Filled with Praline', price: 96, unit: 'kg', img: PATCHI_Product1, boxed: true },
      { id: 'ggf0005', ref: 'GGF0005', store: 'Coffrets', name: 'Filled Chocolate Box 1025 g', price: 163, img: PATCHI_Product2, boxed: true },
      { id: 'gns0013', ref: 'GNS0013', store: 'My Treat', name: 'Dragée Diet Almond Milk, 250 g', price: 45, img: PATCHI_Product3, boxed: true },
      { id: 'gbr0002', ref: 'GBR0002', store: 'Tablettes', name: 'Chocolate Bar 100 g Noblesse 70%', price: 15, img: PATCHI_Product4, boxed: true },
    ],
  },
  {
    id: 'adidas',
    name: 'adidas',
    logo: '/img/logos/adidas-white.png',
    theme: 'black',
    tagline: 'Sport & lifestyle',
    title: 'Le sport,',
    accent: 'en style.',
    accentInline: true,
    subtitle: 'Chaussures, vêtements et accessoires pour homme, femme et enfant.',
    hero: { img: null, name: '[Produit adidas]', price: null },
    // Photos et prix à venir : catégories reprises de brands.js
    products: [
      { id: 'adidas-chaussures', store: 'Chaussures', name: '[Produit adidas]', price: null },
      { id: 'adidas-vetements', store: 'Vêtements', name: '[Produit adidas]', price: null },
      { id: 'adidas-accessoires', store: 'Accessoires', name: '[Produit adidas]', price: null },
      { id: 'adidas-enfant', store: 'Enfant', name: '[Produit adidas]', price: null },
    ],
  },
  {
    id: 'celio',
    name: 'celio',
    logo: '/img/logos/celio.png',
    theme: 'white',
    tagline: 'Mode homme',
    title: 'Le vestiaire',
    accent: 'masculin.',
    accentInline: true,
    subtitle: 'Chemises, jeans, chinos et tous les essentiels du vestiaire masculin.',
    hero: { img: null, name: '[Produit Celio]', price: null },
    // Photos et prix à venir
    products: [
      { id: 'celio-chemises', store: 'Chemises', name: '[Produit Celio]', price: null },
      { id: 'celio-jeans', store: 'Jeans', name: '[Produit Celio]', price: null },
      { id: 'celio-pantalons', store: 'Pantalons & chinos', name: '[Produit Celio]', price: null },
      { id: 'celio-vestes', store: 'Vestes', name: '[Produit Celio]', price: null },
    ],
  },
]

// Chaque Maison a sa page dédiée
export const MAISON_PAGES = ['kyra', 'patchi', 'adidas', 'celio']
export const maisonHref = (id) => (MAISON_PAGES.includes(id) ? `#maison/${id}` : `#${id}`)

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
