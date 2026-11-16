// Données fantômes : les 4 Maisons de la home.
// Produits Kyra repris de l'existant (app.js), images dans public/img.

export const houses = [
  {
    id: 'kyra',
    name: 'kyra',
    logo: null, // pas de fichier logo : wordmark en texte
    theme: 'beige',
    tagline: 'Parfums · Maquillage & soins',
    title: 'Les grandes maisons de',
    accent: 'beauté.',
    subtitle:
      'Chanel, Dior, Hermès, Tom Ford, blackUp, Calvin Klein et Versace : parfums, maquillage et soins.',
    hero: { img: '/img/dior-miss-dior-parfum.webp', name: 'Miss Dior Parfum', price: 78 },
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
    hero: { img: '/img/logos/patchi-placeholder.png', name: 'Filled Chocolate Box 1026 g', price: 163, boxed: true },
    products: [],
  },
  {
    id: 'adidas',
    name: 'adidas',
    logo: '/img/logos/adidas-white.png',
    theme: 'black',
    tagline: 'Sport & lifestyle',
    hero: { img: null, name: '[Produit adidas]', price: null },
    products: [],
  },
  {
    id: 'celio',
    name: 'celio',
    logo: '/img/logos/celio.png',
    theme: 'white',
    tagline: 'Mode homme',
    hero: { img: null, name: '[Produit Celio]', price: null },
    products: [],
  },
]

export const formatPrice = (price) => (price == null ? '[Prix]' : `$${price}`)