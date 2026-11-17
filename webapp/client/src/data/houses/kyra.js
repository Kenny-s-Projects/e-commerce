// Kyra : parfums, maquillage et soins des grandes maisons.
// 29 produits repris de l'existant (app.js), photos dans public/img.
// cat = maison de beauté (sert aux filtres et aux collections).

const products = [
  { id: 'chanel-n5-deodorant', cat: 'chanel', store: 'Chanel', name: 'N°5 The Deodorant', kind: 'Parfum', desc: 'Déodorant vaporisateur, 100 ml', price: 93, img: '/img/chanel-n5-deodorant.webp' },
  { id: 'chanel-chance-eau-tendre', cat: 'chanel', store: 'Chanel', name: 'Chance Eau Tendre', kind: 'Parfum', desc: 'Voile hydratant pour le corps, 100 ml', price: 100, img: '/img/chanel-chance-eau-tendre.webp' },
  { id: 'dior-miss-dior-parfum', cat: 'dior', store: 'Dior', name: 'Miss Dior Parfum', kind: 'Parfum', desc: 'Roller-perle, 20 ml', price: 78, img: '/img/dior-miss-dior-parfum.webp' },
  { id: 'dior-forever-hydra-nude', cat: 'dior', store: 'Dior', name: 'Forever Hydra Nude', kind: 'Maquillage', desc: 'Fond de teint fluide, teinte 6N', price: 78, img: '/img/dior-forever-hydra-nude.webp' },
  { id: 'dior-rouge-blush', cat: 'dior', store: 'Dior', name: 'Rouge Blush Colour & Glow', kind: 'Maquillage', desc: 'Duo blush et illuminateur, teinte 457 Diorette', price: 78, img: '/img/dior-rouge-blush.webp' },
  { id: 'dior-hydra-life', cat: 'dior', store: 'Dior', name: 'Hydra Life', kind: 'Soins', desc: 'Essence sorbet hydratation intense, 40 ml', price: 97, img: '/img/dior-hydra-life.webp' },
  { id: 'hermes-eau-des-merveilles', cat: 'hermes', store: 'Hermès', name: 'Eau des Merveilles', kind: 'Parfum', desc: 'Eau de toilette, 50 ml', price: 93, img: '/img/hermes-eau-des-merveilles.webp' },
  { id: 'hermes-terre-deo', cat: 'hermes', store: 'Hermès', name: 'Terre d’Hermès', kind: 'Parfum', desc: 'Déodorant vaporisateur, 150 ml', price: 63, img: '/img/hermes-terre-deo.webp' },
  { id: 'hermes-twilly-eau-ginger', cat: 'hermes', store: 'Hermès', name: 'Twilly Eau Ginger', kind: 'Parfum', desc: 'Eau de parfum, 50 ml', price: 96, img: '/img/hermes-twilly-eau-ginger.webp' },
  { id: 'hermes-orange-verte-deo', cat: 'hermes', store: 'Hermès', name: 'Eau d’Orange Verte', kind: 'Parfum', desc: 'Déodorant vaporisateur, 150 ml', price: 52, img: '/img/hermes-orange-verte-deo.webp' },
  { id: 'tomford-black-orchid', cat: 'tomford', store: 'Tom Ford', name: 'Black Orchid', kind: 'Parfum', desc: 'Brume pour le corps, 150 ml', price: 74, img: '/img/tomford-black-orchid.webp' },
  { id: 'tomford-for-men-100', cat: 'tomford', store: 'Tom Ford', name: 'Tom Ford for Men', kind: 'Parfum', desc: 'Eau de toilette vaporisateur, 100 ml', price: 98, img: '/img/tomford-for-men-100.webp' },
  { id: 'tomford-for-men-50', cat: 'tomford', store: 'Tom Ford', name: 'Tom Ford for Men', kind: 'Parfum', desc: 'Eau de toilette vaporisateur, 50 ml', price: 71, img: '/img/tomford-for-men-50.webp' },
  { id: 'blackup-nairobi', cat: 'blackup', store: 'blackUp', name: 'Nairobi', kind: 'Parfum', desc: 'Eau de parfum, collection blackUp Parfums', price: 94, img: '/img/blackup-nairobi.webp' },
  { id: 'blackup-reve-de-namibie', cat: 'blackup', store: 'blackUp', name: 'Rêve de Namibie', kind: 'Parfum', desc: 'Eau de parfum, collection blackUp Parfums', price: 94, img: '/img/blackup-reve-de-namibie.webp' },
  { id: 'blackup-rose-des-sables', cat: 'blackup', store: 'blackUp', name: 'Rose des Sables', kind: 'Parfum', desc: 'Eau de parfum, collection blackUp Parfums', price: 94, img: '/img/blackup-rose-des-sables.webp' },
  { id: 'blackup-fdt-creme-poudre', cat: 'blackup', store: 'blackUp', name: 'Fond de Teint Crème Poudré', kind: 'Maquillage', desc: 'Fond de teint crème-poudre, teinte 03, 30 ml', price: 53, img: '/img/blackup-fdt-creme-poudre.webp' },
  { id: 'blackup-haute-couvrance', cat: 'blackup', store: 'blackUp', name: 'Crème Haute Couvrance', kind: 'Maquillage', desc: 'Fond de teint crème haute couvrance, teinte 06, 30 ml', price: 49, img: '/img/blackup-haute-couvrance.webp' },
  { id: 'blackup-two-way-cake', cat: 'blackup', store: 'blackUp', name: 'Two Way Cake', kind: 'Maquillage', desc: 'Fond de teint poudre compacte, teinte 14, 11 g', price: 49, img: '/img/blackup-two-way-cake.webp' },
  { id: 'blackup-cc-cream', cat: 'blackup', store: 'blackUp', name: 'CC Cream Multi-Action', kind: 'Soins', desc: 'Crème correctrice de teint, teinte 05, 30 ml', price: 46, img: '/img/blackup-cc-cream.webp' },
  { id: 'blackup-coil-me-up', cat: 'blackup', store: 'blackUp', name: 'Coil Me Up', kind: 'Soins', desc: 'Définisseur de boucles, 200 ml', price: 33, img: '/img/blackup-coil-me-up.webp' },
  { id: 'ck-euphoria-bold', cat: 'calvinklein', store: 'Calvin Klein', name: 'Euphoria Bold Elixir', kind: 'Parfum', desc: 'Eau de parfum, 50 ml', price: 96, img: '/img/ck-euphoria-bold.webp' },
  { id: 'ck-euphoria-magnetic', cat: 'calvinklein', store: 'Calvin Klein', name: 'Euphoria Magnetic Elixir', kind: 'Parfum', desc: 'Eau de parfum, 50 ml', price: 96, img: '/img/ck-euphoria-magnetic.webp' },
  { id: 'ck-euphoria-solar', cat: 'calvinklein', store: 'Calvin Klein', name: 'Euphoria Solar Elixir', kind: 'Parfum', desc: 'Eau de parfum, 50 ml', price: 96, img: '/img/ck-euphoria-solar.webp' },
  { id: 'ck-defy-parfum', cat: 'calvinklein', store: 'Calvin Klein', name: 'Defy Parfum', kind: 'Parfum', desc: 'Parfum, 50 ml', price: 92, img: '/img/ck-defy-parfum.webp' },
  { id: 'versace-dylan-purple', cat: 'versace', store: 'Versace', name: 'Dylan Purple', kind: 'Parfum', desc: 'Eau de parfum, 30 ml', price: 101, img: '/img/versace-dylan-purple.webp' },
  { id: 'versace-dylan-blue', cat: 'versace', store: 'Versace', name: 'Dylan Blue Pour Femme', kind: 'Parfum', desc: 'Eau de parfum, 30 ml', price: 97, img: '/img/versace-dylan-blue.webp' },
  { id: 'versace-the-dreamer', cat: 'versace', store: 'Versace', name: 'The Dreamer', kind: 'Parfum', desc: 'Eau de toilette, 50 ml', price: 94, img: '/img/versace-the-dreamer.webp' },
  { id: 'versace-dylan-turquoise', cat: 'versace', store: 'Versace', name: 'Dylan Turquoise', kind: 'Parfum', desc: 'Eau de toilette, 30 ml', price: 89, img: '/img/versace-dylan-turquoise.webp' },
]

export default {
  id: 'kyra',
  name: 'kyra',
  logo: '/img/logos/logo-kyra.png',

  /* ---------- Home ---------- */
  theme: 'beige',
  tagline: 'Parfums · Maquillage & soins',
  title: 'Les grandes maisons de',
  accent: 'beauté.',
  subtitle: 'Chanel, Dior, Hermès, Tom Ford, blackUp, Calvin Klein et Versace : parfums, maquillage et soins.',
  hero: { img: '/img/ck-defy-parfum2.webp', name: 'Calvin Klein CK One Eau De Toilette', price: 78 },
  featured: ['chanel-chance-eau-tendre', 'hermes-twilly-eau-ginger', 'tomford-black-orchid', 'versace-dylan-blue'],

  /* ---------- Catalogue ---------- */
  products,
  collections: [
    { id: 'chanel', label: 'Chanel', img: '/img/chanel-chance-eau-tendre.webp' },
    { id: 'dior', label: 'Dior', img: '/img/dior-miss-dior-parfum.webp' },
    { id: 'hermes', label: 'Hermès', img: '/img/hermes-twilly-eau-ginger.webp' },
    { id: 'tomford', label: 'Tom Ford', img: '/img/tomford-black-orchid.webp' },
    { id: 'blackup', label: 'blackUp', img: '/img/blackup-nairobi.webp' },
    { id: 'calvinklein', label: 'Calvin Klein', img: '/img/ck-euphoria-bold.webp' },
    { id: 'versace', label: 'Versace', img: '/img/versace-dylan-blue.webp' },
  ],

  /* ---------- Page Maison ---------- */
  shop: {
    heroTitle: { before: 'Les grandes maisons,', accent: 'à votre porte', after: '.' },
    heroText: 'Parfums, maquillage et soins des grandes maisons, livrés à Gombe le jour même.',
    collectionsTitle: { before: 'Les', accent: 'maisons' },
    collectionsText: 'Sept maisons de parfum et de beauté, en stock chez Kyra.',
    fit: 'contain',
    colors: {
      hero: 'bg-beige text-ink',
      page: 'bg-[#f7f4ef] text-ink',
      card: 'bg-beige',
      pill: 'bg-ink text-cream',
      band: 'bg-ink text-cream',
      tile: 'bg-cream border-white',
    },
    radius: '',
    editorial: {
      eyebrow: 'Le conseil',
      title: { before: 'Une question sur un parfum ? Notre', accent: 'concierge', after: 'vous répond.' },
      cta: 'Écrire sur WhatsApp',
      href: 'https://wa.me/243818592999',
      img: '/img/hermes-eau-des-merveilles.webp',
    },
    next: 'adidas',
  },
}
