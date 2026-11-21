// Données fantômes : les 4 Maisons de la home.
// Produits Kyra repris de l'existant (app.js) ; Patchi : vrais produits de l'API (refs ERP).
// Images dans public/img.

// Produits Patchi de la home : vrais produits du catalogue (API). Prix, stock et photos viennent de l'API ;
// en attendant une photo officielle, le visuel neutre Patchi (jamais la photo d'un autre produit).
const PATCHI_PLACEHOLDER = '/img/logos/patchi-placeholder.png'

const PATCHI_IMG_SECTION = '/img/logos/patchi-heroSection.webp' // visuel provisoire
const KYRA_IMG_SECTION = '/img/logos/kyra-heroSection.webp' // visuel provisoire

export const houses = [
  {
    id: 'kyra',
    name: 'kyra',
    logo: "/img/logos/logo-kyra.webp", // pas de fichier logo : wordmark en texte
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
    // Produit vedette du hero : prix réel lu dans l'API (slug), visuel de la Maison tant qu'il n'a pas de photo
    hero: { slug: 'ggf0017', img: PATCHI_IMG_SECTION, name: 'Coffret brique garni, 470 g', price: null, boxed: true },
    // maison : produits du catalogue réel (squelette du prix pendant le chargement)
    // variant : poids proposé par défaut pour les produits au poids (prix et ajout au panier de cette variante)
    products: [
      { id: 'ggf0016', ref: 'GGF0016', maison: 'patchi', store: 'Coffrets', name: 'Coffret orange garni, 465 g', price: null, img: PATCHI_PLACEHOLDER, boxed: true },
      { id: 'gsb0013', ref: 'GSB0013', maison: 'patchi', store: 'Petites boîtes', name: 'Boîte verte garnie, 200 g', price: null, img: PATCHI_PLACEHOLDER, boxed: true },
      { id: 'ccd03', ref: 'CCD03', maison: 'patchi', store: 'Deluxe', name: 'Capricio', variant: '250 g', price: null, img: PATCHI_PLACEHOLDER, boxed: true },
      { id: 'ccn02', ref: 'CCN02', maison: 'patchi', store: 'Classiques', name: 'Noblesse', variant: '250 g', price: null, img: PATCHI_PLACEHOLDER, boxed: true },
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
  const n = Number(price)
  const amount = Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
  return unit ? `${amount} / ${unit}` : amount
}
