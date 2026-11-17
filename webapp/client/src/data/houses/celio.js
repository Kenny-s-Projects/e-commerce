// Celio : catalogue vide dans l'existant.
// ⚠️ DONNÉES FANTÔMES pour le prototype : noms et prix indicatifs, inventés,
// à remplacer par le vrai catalogue (photos, prix, stock) avant toute mise en ligne.
// Les 8 catégories sont reprises de brands.js.

const LABELS = {
  chemises: 'Chemises',
  tshirts: 'T-shirts & polos',
  pantalons: 'Pantalons & chinos',
  jeans: 'Jeans',
  pulls: 'Pulls & sweats',
  vestes: 'Vestes & blousons',
  sousvet: 'Sous-vêtements',
  accessoires: 'Accessoires',
}

const raw = [
  { id: 'celio-chemise-oxford', cat: 'chemises', name: 'Chemise Oxford slim', price: 35 },
  { id: 'celio-chemise-lin', cat: 'chemises', name: 'Chemise en lin', price: 40 },
  { id: 'celio-polo-pique', cat: 'tshirts', name: 'Polo piqué', price: 25 },
  { id: 'celio-tshirt-col-rond', cat: 'tshirts', name: 'T-shirt col rond coton', price: 15 },
  { id: 'celio-chino-slim', cat: 'pantalons', name: 'Chino slim', price: 40 },
  { id: 'celio-pantalon-lin', cat: 'pantalons', name: 'Pantalon en lin', price: 45 },
  { id: 'celio-jean-slim', cat: 'jeans', name: 'Jean slim brut', price: 45 },
  { id: 'celio-jean-straight', cat: 'jeans', name: 'Jean straight délavé', price: 45 },
  { id: 'celio-pull-col-rond', cat: 'pulls', name: 'Pull col rond', price: 35 },
  { id: 'celio-sweat-capuche', cat: 'pulls', name: 'Sweat à capuche', price: 35 },
  { id: 'celio-veste-jean', cat: 'vestes', name: 'Veste en jean', price: 60 },
  { id: 'celio-blouson', cat: 'vestes', name: 'Blouson léger', price: 70 },
  { id: 'celio-boxers', cat: 'sousvet', name: 'Boxers, lot de 3', price: 25 },
  { id: 'celio-ceinture', cat: 'accessoires', name: 'Ceinture en cuir', price: 25 },
]

const products = raw.map((p) => ({ ...p, store: LABELS[p.cat] }))

export default {
  id: 'celio',
  name: 'celio',
  logo: '/img/logos/celio.png',

  /* ---------- Home ---------- */
  theme: 'white',
  tagline: 'Mode homme',
  title: 'Le vestiaire',
  accent: 'masculin.',
  accentInline: true,
  subtitle: 'Chemises, jeans, chinos et tous les essentiels du vestiaire masculin.',
  hero: { img: null, name: '[Produit Celio]', price: null },
  featured: ['celio-chemise-oxford', 'celio-jean-slim', 'celio-chino-slim', 'celio-veste-jean'],

  /* ---------- Catalogue ---------- */
  products,
  collections: Object.entries(LABELS).map(([id, label]) => ({ id, label })),

  /* ---------- Page Maison ---------- */
  shop: {
    heroTitle: { before: 'L’essentiel,', accent: 'bien coupé', after: '.' },
    heroText: 'Chemises, jeans, chinos et tous les essentiels du vestiaire masculin.',
    collectionsTitle: { before: 'Le', accent: 'vestiaire' },
    collectionsText: 'Huit rayons pour tout le vestiaire, de la chemise à la ceinture.',
    fit: 'contain',
    colors: {
      hero: 'bg-white text-ink',
      page: 'bg-[#f6f6f4] text-ink',
      card: 'bg-white',
      pill: 'bg-ink text-white',
      band: 'bg-ink text-white',
      tile: 'bg-[#f3f2ef] border-white',
    },
    radius: '',
    editorial: {
      eyebrow: 'Le vestiaire',
      title: { before: 'Une chemise, un chino, et la semaine est', accent: 'réglée.' },
      cta: 'Voir les chemises',
      filter: 'chemises',
    },
    next: 'patchi',
  },
}
