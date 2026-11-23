// Contenus des pages Maison Patchi, adidas et Celio (textes, listes, couleurs).
// Les catalogues sont dans catalog.js ; Kyra garde sa page générique (pages/Maison).
import { patchiCatalog, adidasCatalog, celioCatalog } from './catalog.js'

export const PATCHI_IMG = '/img/logos/patchi-placeholder.png' // visuel provisoire

/* ======================= PATCHI ======================= */

// Une praline = un fond de section + l'aspect du chocolat dessiné en CSS (en attendant les photos)
// choco.base : couleur du chocolat · choco.deco : 'gold' | 'drizzle' | 'nut' | 'plain' · choco.shape : 'round' | 'square'
export const patchiFlavors = [
  { id: 'ccd05', ref: 'CCD05', name: 'Prestige', erp: 'Prestige Chocolate', coll: 'Deluxe', stock: 15, bg: '#8eb48e', fg: '#1c3322', choco: { base: '#7a4a2c', deco: 'drizzle', shape: 'round' } },
  { id: 'ccd03', ref: 'CCD03', name: 'Capricio', erp: 'Capricio Chocolate', coll: 'Deluxe', stock: 10, bg: '#3b2418', fg: '#f2eee1', choco: { base: '#4a2a1a', deco: 'gold', shape: 'square' } },
  { id: 'ccd04', ref: 'CCD04', name: 'Gaufrette', erp: 'Chocolate Wafer Milk Square', coll: 'Deluxe', stock: 16, bg: '#1c3322', fg: '#f2eee1', choco: { base: '#8a5a36', deco: 'plain', shape: 'square' } },
  { id: 'ccn01', ref: 'CCN01', name: 'Finesse', erp: 'Finesse Chocolate', coll: 'Classiques', stock: 10, bg: '#e6d8bd', fg: '#3b2418', choco: { base: '#5c3520', deco: 'nut', shape: 'round' } },
  { id: 'ccn02', ref: 'CCN02', name: 'Noblesse', erp: 'Noblesse Chocolate', coll: 'Classiques', stock: 10, bg: '#c9a96a', fg: '#1c3322', choco: { base: '#2e1a10', deco: 'gold', shape: 'round' } },
  { id: 'ccn03', ref: 'CCN03', name: 'Audace', erp: 'Audace Chocolate', coll: 'Classiques', stock: 10, bg: '#5a3523', fg: '#f2eee1', choco: { base: '#3a2214', deco: 'drizzle', shape: 'square' } },
]

export const patchiPage = {
  hero: {
    labels: ['Est. 1974 · Beyrouth', 'Maison de chocolat', 'Kinshasa · Gombe'],
    captions: ['Un coffret se reçoit.', 'Il s’ouvre,', 'et se partage.'],
    title: 'Depuis 1974,',
    accent: 'l’art d’offrir.',
    text: 'Chocolats fins au poids, coffrets garnis, dragées et tablettes, livrés le jour même à Gombe.',
  },
  pillars: [
    { n: '01', title: 'Au poids', text: 'Pralines Deluxe et Classiques servies au gramme, à $96 le kilo.' },
    { n: '02', title: 'En coffret', text: 'Grandes boîtes garnies, prêtes à offrir, de 780 g à 1 025 g.' },
    { n: '03', title: 'Sans sucre ajouté', text: 'Petites boîtes et dragées My Treat pour tous les palais.' },
    { n: '04', title: 'Livré le jour même', text: 'À Gombe, à moto, ou à retirer en boutique.' },
  ],
  weights: [
    { label: '250 g', kg: 0.25 },
    { label: '500 g', kg: 0.5 },
    { label: '1 kg', kg: 1 },
  ],
  boxSizes: [
    { id: 'petit', label: 'Petit', weight: '250 g', kg: 0.25, slots: 6 },
    { id: 'moyen', label: 'Moyen', weight: '500 g', kg: 0.5, slots: 12 },
    { id: 'grand', label: 'Grand', weight: '1 kg', kg: 1, slots: 20 },
  ],
  pricePerKg: 96,
  collections: [
    { id: 'deluxe', label: 'Deluxe', note: 'Au poids, prix au kg' },
    { id: 'classic', label: 'Classiques', note: 'Au poids, prix au kg' },
    { id: 'giftboxes', label: 'Coffrets', note: 'Grandes boîtes garnies' },
    { id: 'smallboxes', label: 'Petites boîtes', note: 'Dont sans sucre ajouté' },
    { id: 'mytreat', label: 'My Treat', note: 'Sachets de dragées, 250 g' },
    { id: 'bars', label: 'Tablettes', note: 'Tablettes de 100 g' },
  ],
  products: patchiCatalog,
}

/* ======================= ADIDAS ======================= */

export const adidasPage = {
  who: [
    { id: 'homme', label: 'Homme' },
    { id: 'femme', label: 'Femme' },
    { id: 'enfant', label: 'Enfant' },
  ],
  marquee: ['Samba', 'Gazelle', 'Stan Smith', 'Superstar', 'Ultraboost'],
  rayons: [
    { id: 'chaussures', n: '01', label: 'Chaussures', note: 'Running, lifestyle, football', tilt: -2 },
    { id: 'vetements', n: '02', label: 'Vêtements', note: 'T-shirts, joggings, survêtements', tilt: 1.5 },
    { id: 'accessoires', n: '03', label: 'Accessoires', note: 'Sacs, casquettes, chaussettes', tilt: -1 },
  ],
  icons: [
    { name: 'Samba OG', who: 'Homme', id: 'adidas-samba-og' },
    { name: 'Gazelle', who: 'Femme', id: 'adidas-gazelle' },
    { name: 'Stan Smith', who: 'Homme', id: 'adidas-stan-smith' },
    { name: 'Superstar', who: 'Enfant', id: 'adidas-superstar-enfant' },
    { name: 'Ultraboost', who: 'Femme', id: 'adidas-ultraboost' },
  ],
  colors: [
    { name: 'Blanc / Noir', upper: '#f5f5f5', stripes: '#171717', sole: '#e5e5e5' },
    { name: 'Noir / Blanc', upper: '#1f1f1f', stripes: '#f5f5f5', sole: '#f5f5f5' },
    { name: 'Vert / Gomme', upper: '#2f5d3a', stripes: '#f5f5f5', sole: '#b5895a' },
  ],
  sizes: ['40', '40⅔', '41⅓', '42', '42⅔', '43⅓', '44', '45'],
  sizeGuide: ['40', '41', '42', '43', '44', '45'],
  products: adidasCatalog,
}

/* ======================= CELIO ======================= */

export const celioPage = {
  intro: 'Chemises, jeans, chinos et tous les essentiels du vestiaire masculin, livrés le jour même à Gombe.',
  cats: [
    { id: 'chemises', label: 'Chemises' },
    { id: 'tshirts', label: 'T-shirts & polos' },
    { id: 'pantalons', label: 'Pantalons & chinos' },
    { id: 'jeans', label: 'Jeans' },
    { id: 'pulls', label: 'Pulls & sweats' },
    { id: 'vestes', label: 'Vestes & blousons' },
    { id: 'sousvet', label: 'Sous-vêtements' },
    { id: 'accessoires', label: 'Accessoires' },
  ],
  // Le look de la semaine : position des points sur la photo (en %)
  look: {
    title: 'Bureau, puis',
    accent: 'dîner.',
    pieces: [
      { id: 'celio-chemise-oxford', name: 'Chemise Oxford slim', cat: 'Chemises', x: 46, y: 28 },
      { id: 'celio-veste-jean', name: 'Veste en jean', cat: 'Vestes & blousons', x: 22, y: 36 },
      { id: 'celio-chino-slim', name: 'Chino slim', cat: 'Pantalons & chinos', x: 50, y: 62 },
      { id: 'celio-ceinture', name: 'Ceinture en cuir', cat: 'Accessoires', x: 64, y: 48 },
    ],
  },
  cuts: [
    { id: 'slim', label: 'Slim', note: 'Ajusté de la hanche à la cheville', path: 'M32 6 H68 L64 194 H53 L50 70 L47 194 H36 Z' },
    { id: 'straight', label: 'Straight', note: 'Droit, de la cuisse à l’ourlet', path: 'M29 6 H71 L70 194 H55 L50 70 L45 194 H30 Z' },
    { id: 'regular', label: 'Regular', note: 'Confortable, coupe classique', path: 'M26 6 H74 L77 194 H57 L50 70 L43 194 H23 Z' },
  ],
  products: celioCatalog,
}
