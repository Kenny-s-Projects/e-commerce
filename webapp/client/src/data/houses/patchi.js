// Patchi : 18 produits de l'ERP (Product Master Patchi, octobre 2026), repris de brands.js.
// unit: 'kg' → chocolat au poids, prix au kg. stock = stock reçu (kg pour le vrac).
// Visuel provisoire en attendant les photos nommées par référence (CCD01.webp, GGF0004.webp…).

const IMG = '/img/logos/patchi-placeholder.png'

const LABELS = {
  deluxe: 'Deluxe',
  classic: 'Classiques',
  giftboxes: 'Coffrets',
  smallboxes: 'Petites boîtes',
  mytreat: 'My Treat',
  bars: 'Tablettes',
}

const raw = [
  { ref: 'CCD01', cat: 'deluxe', name: 'Chocolate Milk Filled with Praline', price: 96, unit: 'kg', stock: 5 },
  { ref: 'CCD03', cat: 'deluxe', name: 'Capricio Chocolate', price: 96, unit: 'kg', stock: 10 },
  { ref: 'CCD04', cat: 'deluxe', name: 'Chocolate Wafer Milk Square', price: 96, unit: 'kg', stock: 16 },
  { ref: 'CCN01', cat: 'classic', name: 'Finesse Chocolate', price: 96, unit: 'kg', stock: 10 },
  { ref: 'CCN02', cat: 'classic', name: 'Noblesse Chocolate', price: 96, unit: 'kg', stock: 10 },
  { ref: 'CCN03', cat: 'classic', name: 'Audace Chocolate', price: 96, unit: 'kg', stock: 10 },
  { ref: 'GGF0004', cat: 'giftboxes', name: 'Filled Chocolate Box 780 g', price: 126, stock: 6 },
  { ref: 'GGF0005', cat: 'giftboxes', name: 'Filled Chocolate Box 1025 g', price: 163, stock: 6 },
  { ref: 'GGF0006', cat: 'giftboxes', name: 'Filled Chocolate Box 785 g', price: 126, stock: 6 },
  { ref: 'GNS0009', cat: 'smallboxes', name: 'Filled Chocolate Box 225 g, No Added Sugar', price: 41, stock: 6 },
  { ref: 'GNS0010', cat: 'smallboxes', name: 'Filled Chocolate Box 225 g, No Added Sugar', price: 41, stock: 6 },
  { ref: 'GSB0003', cat: 'smallboxes', name: 'Green Filled Chocolate Box 195 g', price: 39, stock: 6 },
  { ref: 'GNS0013', cat: 'mytreat', name: 'Dragée Diet Almond Milk, Bag 250 g', price: 45, stock: 3 },
  { ref: 'GNS0014', cat: 'mytreat', name: 'Dragée Diet Bitter, Bag 250 g', price: 45, stock: 3 },
  { ref: 'GNS0015', cat: 'mytreat', name: 'Dragée Diet Milk Hazelnut, Bag 250 g', price: 45, stock: 3 },
  { ref: 'GBR0001', cat: 'bars', name: 'Chocolate Bar 100 g Finesse', price: 15, stock: 3 },
  { ref: 'GBR0002', cat: 'bars', name: 'Chocolate Bar 100 g Noblesse 70%', price: 15, stock: 2 },
  { ref: 'GBR0003', cat: 'bars', name: 'Chocolate Bar 100 g Audace', price: 15, stock: 2 },
]

const products = raw.map((p) => ({
  ...p,
  id: p.ref.toLowerCase(),
  store: LABELS[p.cat],
  img: IMG, // à remplacer par `/img/patchi/${p.ref}.webp` quand les photos arrivent
  boxed: true,
}))

export default {
  id: 'patchi',
  name: 'Patchi',
  logo: '/img/logos/patchi.png',

  /* ---------- Home ---------- */
  theme: 'green',
  tagline: 'Chocolats & cadeaux',
  title: 'Le chocolat,',
  accent: 'l’art d’offrir.',
  accentInline: true,
  subtitle: 'Chocolats fins au poids, coffrets garnis, dragées et tablettes.',
  hero: { img: IMG, name: 'Filled Chocolate Box 1025 g', price: 163, boxed: true },
  featured: ['ccd01', 'ggf0005', 'gns0013', 'gbr0002'],

  /* ---------- Catalogue ---------- */
  products,
  collections: [
    { id: 'deluxe', label: 'Deluxe', note: 'Au poids, prix au kg', img: IMG },
    { id: 'classic', label: 'Classiques', note: 'Au poids, prix au kg', img: IMG },
    { id: 'giftboxes', label: 'Coffrets', note: 'Grandes boîtes garnies', img: IMG },
    { id: 'smallboxes', label: 'Petites boîtes', note: 'Dont sans sucre ajouté', img: IMG },
    { id: 'mytreat', label: 'My Treat', note: 'Sachets de dragées, 250 g', img: IMG },
    { id: 'bars', label: 'Tablettes', note: 'Tablettes de 100 g', img: IMG },
  ],

  /* ---------- Page Maison ---------- */
  shop: {
    heroTitle: { before: 'Depuis 1974,', accent: 'l’art d’offrir', after: 'le chocolat.' },
    heroText: 'Chocolats fins au poids, coffrets garnis, dragées et tablettes, livrés le jour même à Gombe.',
    collectionsTitle: { before: 'Les', accent: 'collections' },
    collectionsText: 'Six chapitres, de la praline au poids au grand coffret.',
    fit: 'bleed',
    colors: {
      hero: 'bg-green text-paper',
      page: 'bg-paper text-forest',
      card: 'bg-green',
      pill: 'bg-[#1c3322] text-paper',
      band: 'bg-[#1c3322] text-paper',
      tile: 'bg-green border-paper',
    },
    radius: 'rounded-[14px]',
    editorial: {
      eyebrow: 'Le coffret',
      title: { before: 'Un coffret Patchi se', accent: 'compose,', after: 'comme un bouquet.' },
      cta: 'Voir les coffrets',
      filter: 'giftboxes',
      img: IMG,
    },
    next: 'kyra',
  },
}
