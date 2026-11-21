// Contenus des pages Offrir, Notre histoire et Aide.
// Entre crochets : informations à fournir par Kenny's International (rien n'a été inventé).

/* ======================= OFFRIR ======================= */
// Chaque onglet a son adresse : #offrir/pour-elle, #offrir/pour-lui…
export const offrir = {
  title: 'Offrir',
  text: 'Des idées cadeaux de Kyra, Patchi, adidas et Celio, livrées le jour même à Gombe.',
  tabs: [
    {
      id: 'pour-elle',
      label: 'Pour elle',
      text: 'Parfums et soins des grandes maisons, un coffret Patchi pour adoucir le tout.',
      hero: '/img/hermes-twilly-eau-ginger.webp',
      heroFit: 'contain',
      tone: 'bg-kyra-card',
      ids: ['chanel-chance-eau-tendre', 'dior-miss-dior-parfum', 'versace-dylan-blue', 'hermes-eau-des-merveilles', 'ggf0016', 'ccd03'],
    },
    {
      id: 'pour-lui',
      label: 'Pour lui',
      text: 'Un parfum, une tablette, et les essentiels adidas et Celio.',
      hero: '/img/ck-defy-parfum.webp',
      heroFit: 'contain',
      tone: 'bg-[#f4f1ec]',
      ids: ['ck-defy-parfum', 'tomford-for-men-100', 'gsb0013', 'adidas-samba-og', 'celio-chemise-oxford', 'celio-ceinture'],
    },
    {
      id: 'coffrets',
      label: 'Coffrets',
      text: 'Les grandes boîtes Patchi, prêtes à offrir, ou un coffret à composer praline par praline.',
      hero: '/img/products/patchi/Chocolate Milk Filled with Praline/Product2.webp',
      heroFit: 'cover',
      tone: 'bg-paper',
      ids: ['ggf0016', 'ggf0017', 'ggf0018', 'gsb0012', 'ccd44', 'ccn02'],
    },
    {
      id: 'moins-de-50',
      label: 'Moins de 50 $',
      text: 'Les petites attentions qui font plaisir, toutes Maisons confondues.',
      hero: '/img/products/patchi/Chocolate Bar 100 g Noblesse/Offert.webp',
      heroFit: 'cover',
      tone: 'bg-paper',
      ids: ['gsb0010', 'gsb0014', 'gsb0015', 'ccf03', 'blackup-coil-me-up', 'blackup-cc-cream'],
    },
  ],
  services: [
    { n: '01', title: 'Un mot glissé dans la boîte', text: 'Écrivez-le au moment de commander. Emballage cadeau [à confirmer].' },
    { n: '02', title: 'Livré le jour même', text: 'À Gombe, à moto, 4 $. Ou retrait en boutique, gratuit, dès 9h00.' },
    { n: '03', title: 'Un conseil sur WhatsApp', text: 'Un budget, une occasion : le concierge compose avec vous.' },
  ],
}

/* ======================= NOTRE HISTOIRE ======================= */
export const histoire = {
  eyebrow: 'Notre histoire · Kenny’s International',
  title: 'Le luxe de votre vie,',
  accent: 'partagé depuis 1993.',
  manifesto: {
    title: 'Nous ne vendons pas un catalogue. Nous vous',
    accent: 'recevons.',
    text: 'Depuis nos boutiques de Kinshasa, Pointe-Noire et Lubumbashi, kclick prolonge l’expérience Kenny’s en ligne : les mêmes maisons, le même service, livrés à votre porte.',
  },
  chapters: [
    { year: '1993', title: 'Les débuts', text: '[Récit de la création de Kenny’s International, à fournir]', visual: { kind: 'photo', label: '[Photo d’archive]' } },
    { year: '[année]', title: 'Kyra, la parfumerie', text: '[Ouverture de Kyra et arrivée des grandes maisons de beauté, à fournir]', visual: { kind: 'logo', src: '/img/logos/logo-kyra.webp', bg: 'bg-kyra', w: 'w-[46%]' } },
    { year: '[année]', title: 'Patchi, adidas, Celio', text: '[Arrivée des franchises à Kinshasa, à fournir]', visual: { kind: 'logo', src: '/img/logos/patchi.png', bg: 'bg-green', w: 'w-[26%]' } },
    { year: '[année]', title: 'Pointe-Noire et Lubumbashi', text: '[Ouverture des boutiques hors de Kinshasa, à fournir]', visual: { kind: 'photo', label: '[Photo boutique]' } },
    { year: '2026', title: 'kclick, en ligne', text: 'Les Maisons Kenny’s réunies sur une seule adresse, livrées le jour même à Gombe.', visual: { kind: 'word', label: 'kclick' } },
  ],
  cities: [
    { name: 'Kinshasa', text: 'Service client kclick : 124 Boulevard du 30 Juin, Gombe. [Liste des boutiques à fournir]' },
    { name: 'Pointe-Noire', text: '[Adresse et horaires à fournir]' },
    { name: 'Lubumbashi', text: '[Adresse et horaires à fournir]' },
  ],
}

/* ======================= AIDE ======================= */
// Chaque rubrique a son adresse : #aide/livraison, #aide/paiement… (#contact mène à #aide/contact)
export const aide = {
  shortcuts: [
    { section: 'livraison', kicker: 'Livraison', title: 'Le jour même à Gombe', text: '4 $, à moto' },
    { section: 'paiement', kicker: 'Paiement', title: 'Mobile money, carte', text: 'Ou à la livraison' },
    { section: 'contact', kicker: 'Contact', title: '+243 856 486 993', text: 'WhatsApp et téléphone' },
  ],
  sections: [
    {
      id: 'livraison',
      label: 'Livraison et retrait',
      intro: 'Faites-vous livrer à Gombe le jour même, ou passez retirer votre commande en boutique.',
      cards: [
        { kicker: 'Livraison', title: 'Le jour même, 4 $', text: 'À Gombe, à moto. Autres communes de Kinshasa : [à confirmer].' },
        { kicker: 'Retrait', title: 'Gratuit, dès 9h00', text: 'En boutique, dès que la commande est prête. Adresse : 124 Boulevard du 30 Juin, Gombe.' },
      ],
      faq: [
        { q: 'Jusqu’à quelle heure puis-je commander pour être livré le jour même ?', a: '[Heure limite à confirmer]' },
        { q: 'Livrez-vous hors de Gombe ?', a: '[Zones et tarifs à confirmer]' },
        { q: 'Qui peut retirer ma commande ?', a: '[Règle de retrait à confirmer : pièce d’identité, numéro de commande…]' },
      ],
    },
    {
      id: 'paiement',
      label: 'Paiement',
      intro: 'Payez comme vous le préférez : en ligne ou au moment de recevoir votre commande.',
      cards: [
        { kicker: 'Mobile money', title: 'Sur votre téléphone', text: '[Opérateurs acceptés à confirmer]' },
        { kicker: 'Carte ou à la livraison', title: 'Carte, espèces', text: 'Carte bancaire, ou paiement à la livraison et au retrait.' },
      ],
      faq: [
        { q: 'Les prix sont-ils en dollars ?', a: 'Oui, les prix sont affichés en dollars US. [Paiement en francs congolais : à confirmer]' },
        { q: 'Mon paiement est-il sécurisé ?', a: '[Prestataire de paiement à préciser]' },
        { q: 'Puis-je payer en plusieurs fois ?', a: '[À confirmer]' },
      ],
    },
    {
      id: 'commandes',
      label: 'Commandes et suivi',
      intro: 'Après votre commande, vous recevez un numéro et un contact WhatsApp pour suivre la livraison.',
      cards: [{ kicker: 'Sans compte', title: 'Suivre ma commande', text: 'Avec le numéro de commande et le téléphone utilisé.', href: '#suivi' }],
      faq: [
        { q: 'Comment suivre ma commande ?', a: 'Sur la page « Suivre ma commande », avec votre numéro de commande et le téléphone utilisé. Le concierge répond aussi sur WhatsApp au +243 856 486 993.' },
        { q: 'Puis-je modifier ma commande ?', a: '[Délai de modification à confirmer]' },
        { q: 'Faut-il créer un compte ?', a: 'Non, la commande se fait sans compte.' },
      ],
    },
    {
      id: 'retours',
      label: 'Retours et échanges',
      intro: '[Politique de retour et d’échange à rédiger avec le service client]',
      cards: [],
      faq: [
        { q: 'Puis-je échanger un parfum ou un vêtement ?', a: '[À confirmer]' },
        { q: 'Les chocolats peuvent-ils être retournés ?', a: '[À confirmer]' },
      ],
    },
    {
      id: 'contact',
      label: 'Contact',
      intro: 'Une question, une commande spéciale, un conseil ? Nous répondons.',
      cards: [
        { kicker: 'WhatsApp et téléphone', title: '+243 856 486 993', text: 'Le plus rapide pour commander ou suivre une livraison.', href: 'https://wa.me/243856486993' },
        { kicker: 'E-mail', title: 'serviceclient@kennysinternational.com', text: 'Réponse sous [délai à confirmer].', href: 'mailto:serviceclient@kennysinternational.com' },
        { kicker: 'Adresse', title: '124 Boulevard du 30 Juin', text: 'Gombe, Kinshasa.' },
        { kicker: 'Horaires', title: '[À confirmer]', text: 'Du lundi au samedi [à confirmer].' },
      ],
      faq: [],
    },
  ],
}
