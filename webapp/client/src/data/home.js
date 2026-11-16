// Contenus de la home après les 4 Maisons : Sélection, Offrir, services, pied de page.

// La Sélection : ids de produits pris dans houses.js, avec le fond de chaque carte
export const selection = [
  { id: 'hermes-twilly-eau-ginger', tone: 'bg-[#f1f0ed]' },
  { id: 'ggf0005', tone: 'bg-green' },
  { id: 'tomford-black-orchid', tone: 'bg-beige' },
  { id: 'versace-dylan-blue', tone: 'bg-[#f1f0ed]' },
  { id: 'gbr0002', tone: 'bg-green' },
  { id: 'chanel-chance-eau-tendre', tone: 'bg-beige' },
]

// Offrir : idées cadeaux
export const gifts = {
  title: 'Offrir',
  text: 'Des idées cadeaux, toutes Maisons confondues, livrées le jour même à Gombe.',
  items: [
    { id: 'pour-elle', label: 'Pour elle', img: '/img/chanel-chance-eau-tendre.webp', fit: 'contain', tone: 'bg-beige' },
    { id: 'pour-lui', label: 'Pour lui', img: '/img/versace-dylan-blue.webp', fit: 'contain', tone: 'bg-[#f1f0ed]' },
    { id: 'coffrets', label: 'Coffrets', img: '/img/logos/patchi-placeholder.png', fit: 'bleed', tone: 'bg-green' },
    { id: 'moins-de-50', label: 'Moins de 50 $', img: '/img/logos/patchi-placeholder.png', fit: 'boxed', tone: 'bg-paper' },
  ],
}

// Bandeau services
export const services = [
  { label: 'Livraison', text: 'Le jour même à Gombe, à moto. 4 $.' },
  { label: 'Retrait', text: 'En boutique, gratuit, dès 9h00.' },
  { label: 'Paiement', text: 'Mobile money, carte ou à la livraison.' },
  { label: 'Concierge', text: 'Commander sur WhatsApp', href: 'https://wa.me/243818592999' },
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
  signature: ['par Kenny’s International', 'Le luxe de votre vie, partagé depuis 1995.'],
  columns: [
    {
      title: 'Maisons',
      links: [
        { label: 'Kyra', href: '#maison/kyra' },
        { label: 'Patchi', href: '#maison/patchi' },
        { label: 'adidas', href: '#maison/adidas' },
        { label: 'Celio', href: '#maison/celio' },
      ],
    },
    {
      title: 'Aide',
      links: [
        { label: 'Livraison et retrait', href: '#aide/livraison' },
        { label: 'Paiement', href: '#aide/paiement' },
        { label: 'Contact', href: '#contact' },
        { label: 'Conditions de vente', href: '#conditions' },
      ],
    },
  ],
  copyright: '© 2026 Kenny’s Group',
}
