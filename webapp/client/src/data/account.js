// Compte client de démonstration (écrans Mon compte et Suivi de commande).
// Sera remplacé par la connexion Supabase (code par e-mail) et l'API des commandes.

export const DEMO_EMAIL = 'merveille.kabongo@exemple.com'

export const account = {
  firstName: 'Merveille',
  lastName: 'Kabongo',
  email: DEMO_EMAIL,
  phone: '+243 81 000 0000',
  lang: 'fr',
}

// Couleur du point de chaque Maison
export const HOUSE_COLORS = { kyra: '#cf6333', patchi: '#93b993', adidas: '#141414', celio: '#c8102e' }
export const HOUSE_NAMES = { kyra: 'Kyra', patchi: 'Patchi', adidas: 'adidas', celio: 'Celio' }

// Statuts affichés au client (mêmes couleurs que le dashboard)
export const STATUS = {
  en_attente: { label: 'Reçue', bg: '#e3ecf8', fg: '#1f4e8c' },
  en_preparation: { label: 'En préparation', bg: '#fbefd5', fg: '#7a5200' },
  en_cours: { label: 'En préparation', bg: '#fbefd5', fg: '#7a5200' },
  prete_retrait: { label: 'Prête', bg: '#e1eee2', fg: '#2f5a37' },
  en_route: { label: 'En route', bg: '#fbe4d8', fg: '#9a3f1c' },
  en_livraison: { label: 'En route', bg: '#fbe4d8', fg: '#9a3f1c' },
  livree: { label: 'Livrée', bg: '#d7e9dc', fg: '#1f4a2c' },
  retiree: { label: 'Retirée', bg: '#d7e9dc', fg: '#1f4a2c' },
  refusee: { label: 'Refusée', bg: '#f7deda', fg: '#8e2118' },
  annulee: { label: 'Annulée', bg: '#f7deda', fg: '#8e2118' },
}

export const currentOrder = { number: 'KC-0142', status: 'en_preparation', houses: ['kyra', 'patchi'], total: 130 }

export const pastOrders = [
  { number: 'KC-0127', date: '12 novembre', houses: ['kyra'], total: 96 },
  { number: 'KC-0119', date: '3 novembre', houses: ['patchi'], total: 45 },
]

export const addresses = [
  { id: 'maison', label: 'Maison', commune: 'Gombe', street: 'avenue de la Justice', landmark: 'près du rond-point Socimat, portail bleu', isDefault: true },
  { id: 'bureau', label: 'Bureau', commune: 'Gombe', street: 'boulevard du 30 Juin, immeuble Crown', landmark: '5e étage, accueil', isDefault: false },
]

// Produits favoris (identifiants du catalogue du site)
export const favorites = ['dior-miss-dior-parfum', 'versace-dylan-blue', 'chanel-chance-eau-tendre', 'ggf0016']

/*
 * Suivi de commande : étapes avec l'heure (null = pas encore atteinte).
 * current = index de l'étape en cours.
 */
export const trackedOrders = {
  'KC-0140': {
    number: 'KC-0140',
    status: 'en_route',
    rider: 'Jonathan',
    etaMinutes: 12,
    steps: [
      { label: 'Commande reçue', time: '9:48' },
      { label: 'En préparation chez Kyra', time: '9:51' },
      { label: 'Prête', time: '10:24' },
      { label: 'En route', time: '10:31' },
      { label: 'Livrée', time: null },
    ],
    current: 3,
    items: [{ productId: 'versace-dylan-blue', house: 'Kyra', brand: 'Versace', name: 'Dylan Blue Pour Femme', price: 97, qty: 1 }],
    delivery: 4,
    total: 101,
    payment: 'mobile money',
  },
  'KC-0142': {
    number: 'KC-0142',
    status: 'en_preparation',
    rider: null,
    etaMinutes: null,
    steps: [
      { label: 'Commande reçue', time: '10:21' },
      { label: 'En préparation chez Kyra et Patchi', time: '10:23' },
      { label: 'Prête', time: null },
      { label: 'En route', time: null },
      { label: 'Livrée', time: null },
    ],
    current: 1,
    items: [
      { productId: 'dior-miss-dior-parfum', house: 'Kyra', brand: 'Dior', name: 'Miss Dior Parfum', price: 78, qty: 1 },
      { productId: 'ccd01', house: 'Patchi', brand: 'Patchi', name: 'Chocolate Milk Filled with Praline, 500 g', price: 48, qty: 1 },
    ],
    delivery: 4,
    total: 130,
    payment: 'mobile money',
  },
}
