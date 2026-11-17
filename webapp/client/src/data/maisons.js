// Pages Maison (Kyra et Patchi) : textes, couleurs, filtres et catalogue.
import { kyraCatalog, patchiCatalog } from './catalog.js'

const count = (list, key, id) => list.filter((p) => p[key] === id).length

export const maisons = {
  kyra: {
    id: 'kyra',
    name: 'Kyra',
    wordmark: 'kyra',
    next: 'patchi',
    // Couleurs : hero sur l'orange officiel, catalogue sur une base claire
    heroClass: 'bg-kyra text-kyra-ink',
    bodyClass: 'bg-kyra-card text-kyra-ink [--fg:var(--color-kyra-ink)] [--card:#ffffff]',
    floatClass: 'bg-kyra-card',
    nextClass: 'bg-kyra text-kyra-ink',
    title: 'Les grandes maisons de',
    accent: 'beauté.',
    story:
      'Chanel, Dior, Hermès, Tom Ford, blackUp, Calvin Klein et Versace : parfums, maquillage et soins, retirés en boutique ou livrés le jour même à Gombe.',
    edito: { eyebrow: 'Le geste', title: 'Sept maisons,', accent: 'un seul écrin.', img: '/img/hermes-twilly-eau-ginger.webp', bg: 'bg-kyra text-kyra-ink' },
    floats: ['dior-miss-dior-parfum', 'versace-dylan-blue', 'dior-rouge-blush', 'hermes-twilly-eau-ginger', 'tomford-black-orchid', 'ck-euphoria-bold', 'chanel-chance-eau-tendre'],
    filters: [
      {
        key: 'brand',
        label: 'Maisons',
        options: [
          ['chanel', 'Chanel'], ['dior', 'Dior'], ['hermes', 'Hermès'], ['tomford', 'Tom Ford'],
          ['blackup', 'blackUp'], ['calvinklein', 'Calvin Klein'], ['versace', 'Versace'],
        ],
      },
      { key: 'cls', label: 'Catégories', options: [['perfume', 'Parfums'], ['makeup', 'Maquillage'], ['skincare', 'Soins']] },
    ],
    products: kyraCatalog,
  },

  patchi: {
    id: 'patchi',
    name: 'Patchi',
    logo: '/img/logos/patchi.png',
    next: 'kyra',
    heroClass: 'bg-green text-forest',
    bodyClass: 'bg-paper text-forest [--fg:var(--color-forest)] [--card:#ffffff]',
    floatClass: 'bg-paper rounded-2xl',
    nextClass: 'bg-green text-forest',
    title: 'Depuis 1974,',
    accent: 'l’art d’offrir.',
    story: 'Chocolats fins au poids, coffrets garnis, dragées et tablettes, livrés le jour même à Gombe.',
    edito: { eyebrow: 'Le coffret', title: 'Un coffret Patchi se', accent: 'compose.', img: '/img/logos/patchi-placeholder.png', bg: 'bg-forest text-paper', boxed: true },
    floats: ['ccd03', 'ggf0005', 'gbr0003', 'ggf0004', 'gns0014', 'ccd01', 'gbr0002'],
    filters: [
      {
        key: 'cat',
        label: 'Collections',
        options: [
          ['deluxe', 'Deluxe'], ['classic', 'Classiques'], ['giftboxes', 'Coffrets'],
          ['smallboxes', 'Petites boîtes'], ['mytreat', 'My Treat'], ['bars', 'Tablettes'],
        ],
      },
    ],
    products: patchiCatalog,
  },
}

// Options enrichies : libellé, nombre de produits, 1re image (pour les tuiles de collections)
export const optionsOf = (maison, group) =>
  group.options.map(([id, label]) => {
    const first = maison.products.find((p) => p[group.key] === id)
    return { id, label, count: count(maison.products, group.key, id), img: first?.img, boxed: first?.boxed }
  })
