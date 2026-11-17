// adidas : catalogue vide dans l'existant.
// ⚠️ DONNÉES FANTÔMES pour le prototype : noms et prix indicatifs, inventés,
// à remplacer par le vrai catalogue (photos, prix, stock) avant toute mise en ligne.
// Catégories reprises de brands.js : Chaussures / Vêtements / Accessoires × Homme / Femme / Enfant.

const LABELS = { chaussures: 'Chaussures', vetements: 'Vêtements', accessoires: 'Accessoires' }
const WHO = { homme: 'Homme', femme: 'Femme', enfant: 'Enfant' }

const raw = [
  { id: 'adidas-samba-og', cat: 'chaussures', who: 'homme', name: 'Samba OG', price: 120 },
  { id: 'adidas-gazelle', cat: 'chaussures', who: 'femme', name: 'Gazelle', price: 110 },
  { id: 'adidas-stan-smith', cat: 'chaussures', who: 'homme', name: 'Stan Smith', price: 100 },
  { id: 'adidas-ultraboost', cat: 'chaussures', who: 'femme', name: 'Ultraboost 1.0', price: 190 },
  { id: 'adidas-superstar-enfant', cat: 'chaussures', who: 'enfant', name: 'Superstar', price: 70 },
  { id: 'adidas-survetement', cat: 'vetements', who: 'homme', name: 'Survêtement Adicolor', price: 110 },
  { id: 'adidas-tshirt-trefoil', cat: 'vetements', who: 'femme', name: 'T-shirt Trefoil', price: 35 },
  { id: 'adidas-pantalon-tiro', cat: 'vetements', who: 'homme', name: 'Pantalon Tiro', price: 55 },
  { id: 'adidas-hoodie-enfant', cat: 'vetements', who: 'enfant', name: 'Sweat à capuche Essentials', price: 45 },
  { id: 'adidas-sac-a-dos', cat: 'accessoires', who: 'homme', name: 'Sac à dos Classic', price: 45 },
  { id: 'adidas-casquette', cat: 'accessoires', who: 'femme', name: 'Casquette Trefoil', price: 30 },
  { id: 'adidas-chaussettes', cat: 'accessoires', who: 'enfant', name: 'Chaussettes, 3 paires', price: 18 },
]

const products = raw.map((p) => ({ ...p, store: `${WHO[p.who]} · ${LABELS[p.cat]}` }))

export default {
  id: 'adidas',
  name: 'adidas',
  logo: '/img/logos/adidas-white.png',
  logoDark: '/img/logos/adidas-black.png', // sur fond clair

  /* ---------- Home ---------- */
  theme: 'black',
  tagline: 'Sport & lifestyle',
  title: 'Le sport,',
  accent: 'en style.',
  accentInline: true,
  subtitle: 'Chaussures, vêtements et accessoires pour homme, femme et enfant.',
  hero: { img: null, name: '[Produit adidas]', price: null },
  featured: ['adidas-samba-og', 'adidas-survetement', 'adidas-sac-a-dos', 'adidas-superstar-enfant'],

  /* ---------- Catalogue ---------- */
  products,
  collections: [
    { id: 'chaussures', label: 'Chaussures', note: 'Running, lifestyle, football' },
    { id: 'vetements', label: 'Vêtements', note: 'T-shirts, joggings, survêtements' },
    { id: 'accessoires', label: 'Accessoires', note: 'Sacs, casquettes, chaussettes' },
  ],

  /* ---------- Page Maison ---------- */
  shop: {
    heroTitle: { before: 'Homme. Femme.', accent: 'Enfant.' },
    heroText: 'Chaussures, vêtements et accessoires adidas pour homme, femme et enfant.',
    collectionsTitle: { before: 'Les', accent: 'rayons' },
    collectionsText: 'Trois rayons, du terrain à la ville.',
    fit: 'contain',
    dark: true, // hero sombre : le header passe en blanc
    colors: {
      hero: 'bg-black text-white',
      page: 'bg-white text-ink',
      card: 'bg-[#f3f3f1]',
      pill: 'bg-black text-white',
      band: 'bg-black text-white',
      tile: 'bg-[#161616] border-white/80',
    },
    radius: '',
    editorial: {
      eyebrow: 'Les classiques',
      title: { before: 'Des modèles qui se', accent: 'portent', after: 'partout, depuis toujours.' },
      cta: 'Voir les chaussures',
      filter: 'chaussures',
    },
    next: 'celio',
  },
}
