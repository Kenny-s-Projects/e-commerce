// Contenus de la home après les 4 Maisons : Sélection, Offrir, services, pied de page.
const PATCHI_MoinsFifty = '/img/products/patchi/Chocolate Bar 100 g Noblesse/Offert.webp' // visuel provisoire
const PATCHI_Offert = '/img/products/patchi/Filled Chocolate Box 1025 g/MoinsFifty.avif' // visuel provisoire
// La Sélection : ids de produits pris dans houses.js, avec le fond de chaque carte
export const selection = [
  { id: 'hermes-twilly-eau-ginger', tone: 'bg-[#f1f0ed]' },
  { id: 'ggf0016', tone: 'bg-green' },
  { id: 'tomford-black-orchid', tone: 'bg-beige' },
  { id: 'versace-dylan-blue', tone: 'bg-[#f1f0ed]' },
  { id: 'gsb0013', tone: 'bg-green' },
  { id: 'chanel-chance-eau-tendre', tone: 'bg-beige' },
]

// Offrir : idées cadeaux
export const gifts = {
  title: 'Offrir',
  text: 'Des idées cadeaux, toutes Maisons confondues, livrées le jour même à Gombe.',
  items: [
    { id: 'pour-elle', label: 'Pour elle', img: '/img/chanel-chance-eau-tendre.webp', fit: 'contain', tone: 'bg-beige' },
    { id: 'pour-lui', label: 'Pour lui', img: '/img/versace-dylan-blue.webp', fit: 'contain', tone: 'bg-[#f1f0ed]' },
    { id: 'coffrets', label: 'Coffrets', img: PATCHI_Offert, fit: 'bleed', tone: 'bg-green' },
    { id: 'moins-de-50', label: 'Moins de 50 $', img: PATCHI_MoinsFifty, fit: 'boxed', tone: 'bg-paper' },
  ],
}

// Bandeau services (accueil) : une icône, une ligne normale, une ligne en gras
export const services = [
  { icon: 'delivery', line: 'Livraison', bold: 'le jour même à Gombe' },
  { icon: 'store', line: 'Retrait en boutique', bold: 'gratuit, dès 9h00' },
  { icon: 'payment', line: 'Mobile money, carte', bold: 'ou à la livraison' },
  { icon: 'concierge', line: 'Un conseil ?', bold: 'Concierge WhatsApp', href: 'https://wa.me/243856486993' },
]

// Coordonnées (reprises de brands.js)
export const contact = {
  address: '124 Boulevard du 30 Juin, Gombe',
  phone: '+243 818 592 999',
  phoneHref: 'tel:+243818592999',
  email: 'serviceclient@kennysinternational.com',
}

// Pied de page
export const footer = {
  signature: ['par Kenny’s International', 'Le luxe de votre vie, partagé depuis 1993.'],
  columns: [
    {
      title: 'Maisons',
      links: [
        { label: 'Kyra', href: '#maison/kyra' },
        { label: 'Patchi', href: '#maison/patchi' },
        { label: 'adidas', href: '#adidas' },
        { label: 'Celio', href: '#celio' },
      ],
    },
    {
      title: 'Aide',
      links: [
        { label: 'Suivre ma commande', href: '#suivi' },
        { label: 'Livraison et retrait', href: '#aide/livraison' },
        { label: 'Paiement', href: '#aide/paiement' },
        { label: 'Contact', href: '#contact' },
        { label: 'Conditions de vente', href: '#conditions' },
      ],
    },
  ],
  copyright: '© 2026 Kenny’s Group',
}

// Kenny's International : texte et chiffres clés
export const about = {
  eyebrow: 'Kenny’s International',
  title: 'Nous ne vendons pas un catalogue. Nous vous',
  accent: 'recevons.',
  text: 'Depuis nos boutiques de Kinshasa, Pointe-Noire et Lubumbashi, kclick prolonge l’expérience Kenny’s en ligne : les mêmes maisons, le même service, livrés à votre porte.',
  stats: [
    { value: '20', suffix: '+', label: 'Marques distribuées' },
    { value: '16', label: 'Franchises à Kinshasa' },
    { value: '3', label: 'Villes' },
    { value: '24', suffix: 'h', label: 'Livraison à Kinshasa' },
  ],
  link: { label: 'Notre histoire', href: '#notre-histoire' },
}

// Conciergerie WhatsApp
export const concierge = {
  eyebrow: 'Conciergerie',
  title: 'Préférez commander en',
  accent: 'parlant',
  titleEnd: 'à quelqu’un ?',
  text: 'Un conseiller vous répond sur WhatsApp, prépare votre commande et organise la livraison ou le retrait en boutique.',
  phone: '+243 818 592 999',
  href: 'https://wa.me/243818592999',
}
