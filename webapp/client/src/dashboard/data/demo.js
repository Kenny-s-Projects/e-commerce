// Données de démonstration (reprises de la maquette). Elles seront remplacées par l'API.
// Les heures sont calculées par rapport à maintenant, pour que « il y a 3 min » reste vrai.

const at = (minutesAgo) => new Date(Date.now() - minutesAgo * 60000).toISOString()

export const BRANDS = {
  kyra: { id: 'kyra', name: 'Kyra', color: '#cf6333', shop: 'Kyra Gombe' },
  patchi: { id: 'patchi', name: 'Patchi', color: '#93b993', shop: 'Patchi Gombe' },
  adidas: { id: 'adidas', name: 'adidas', color: '#141414', shop: 'adidas Gombe' },
  celio: { id: 'celio', name: 'Celio', color: '#c8102e', shop: 'Celio Gombe' },
}

export const STAFF = { kyra: 'Aline', patchi: 'Esther', adidas: 'Junior', celio: 'Ruth' }

export const ME = { name: 'Ref Digital', role: 'Super admin' }

export const RIDERS = [
  { id: 'jm', name: 'Jonathan M.', firstName: 'Jonathan', vehicle: 'Moto', zone: 'Gombe', available: true },
  { id: 'hn', name: 'Héritier N.', firstName: 'Héritier', vehicle: 'Moto', zone: 'Gombe', available: true },
  { id: 'gk', name: 'Glody K.', firstName: 'Glody', vehicle: 'Moto', zone: 'Gombe', available: true },
]

const item = (name, detail, price, qty = 1, extra = {}) => ({ name, detail, price, qty, ...extra })
const part = (brand, status, items, extra = {}) => ({ brand, status, items, staff: STAFF[brand], ...extra })

export const ORDERS = [
  {
    number: 'KC-0146', createdAt: at(12), source: 'site',
    customer: { name: 'Nadine Mpiana', phone: '+243 82 214 55 10' },
    mode: 'livraison', deliveryFee: 4,
    address: { commune: 'Gombe', street: 'avenue Colonel Ebeya', landmark: 'immeuble Les Palmiers, 3e étage' },
    parts: [part('kyra', 'en_preparation', [item('Twilly Eau Ginger', 'Eau de parfum, 50 ml', 96, 1, { house: 'Hermès' })], { startedAt: at(9) })],
    payment: { method: 'mobile_money', provider: 'M-Pesa', status: 'paye', at: at(12), ref: 'MP-48213' },
  },
  {
    number: 'KC-0145', createdAt: at(1), source: 'site',
    customer: { name: 'Josué Kanku', phone: '+243 99 120 33 41' },
    mode: 'retrait', deliveryFee: 0, address: null,
    parts: [part('kyra', 'nouvelle', [item('Rouge Blush Colour & Glow', 'Teinte 457 Diorette', 78, 1, { house: 'Dior' })])],
    payment: { method: 'carte', provider: 'Visa', status: 'paye', at: at(1), ref: 'CB-11872' },
  },
  {
    number: 'KC-0143', createdAt: at(3), source: 'site',
    customer: { name: 'Daniel Mutombo', phone: '+243 81 455 20 19' },
    mode: 'livraison', deliveryFee: 4,
    address: { commune: 'Gombe', street: 'boulevard du 30 Juin', landmark: 'immeuble face à la BCDC' },
    parts: [
      part('kyra', 'nouvelle', [item('Chance Eau Tendre', 'Voile hydratant, 100 ml', 100, 1, { house: 'Chanel' })]),
      part('patchi', 'nouvelle', [item('Chocolate Bar 100 g Noblesse', 'Tablette, 100 g', 15, 1, { ref: 'GBR0002' })]),
    ],
    payment: { method: 'mobile_money', provider: 'Orange Money', status: 'paye', at: at(3), ref: 'OM-90311' },
  },
  {
    number: 'KC-0142', createdAt: at(24), source: 'site',
    customer: { name: 'Merveille Kabongo', phone: '+243 81 000 00 00' },
    mode: 'livraison', deliveryFee: 4,
    address: { commune: 'Gombe', street: 'avenue de la Justice', landmark: 'près du rond-point Socimat, portail bleu' },
    parts: [
      part('kyra', 'prete', [item('Miss Dior Parfum', 'Roller-perle 20 ml', 78, 1, { house: 'Dior', ref: '[RÉF]' })], { startedAt: at(22), readyAt: at(14) }),
      part('patchi', 'en_preparation', [item('Chocolate Milk Filled with Praline', '500 g', 48, 1, { ref: 'CCD01', gift: 'Joyeux anniversaire Maman' })], { startedAt: at(19) }),
    ],
    payment: { method: 'mobile_money', provider: 'M-Pesa', status: 'paye', at: at(24), ref: '[RÉF. TRANSACTION]' },
  },
  {
    number: 'KC-0141', createdAt: at(40), source: 'site',
    customer: { name: 'Patrick Ilunga', phone: '+243 97 300 11 08' },
    mode: 'retrait', deliveryFee: 0, address: null,
    parts: [part('patchi', 'prete', [item('Filled Chocolate Box 1025 g', 'Coffret, 1025 g', 163, 1, { ref: 'GGF0005' })], { startedAt: at(36), readyAt: at(20) })],
    payment: { method: 'carte', provider: 'Visa', status: 'paye', at: at(40), ref: 'CB-11801' },
  },
  {
    number: 'KC-0140', createdAt: at(57), source: 'site',
    customer: { name: 'Grâce Mbuyi', phone: '+243 81 770 42 90' },
    mode: 'livraison', deliveryFee: 4,
    address: { commune: 'Gombe', street: 'avenue du Port', landmark: 'résidence Fleuve, entrée B' },
    parts: [part('kyra', 'collectee', [item('Dylan Blue Pour Femme', 'Eau de parfum, 50 ml', 97, 1, { house: 'Versace' })], { startedAt: at(54), readyAt: at(21) })],
    payment: { method: 'mobile_money', provider: 'M-Pesa', status: 'paye', at: at(57), ref: 'MP-47990' },
    riderId: 'jm', assignedAt: at(20), pickedUpAt: at(2), eta: 14,
  },
  {
    number: 'KC-0138', createdAt: at(74), source: 'site',
    customer: { name: 'Sarah Tshibangu', phone: '+243 84 601 77 32' },
    mode: 'livraison', deliveryFee: 4,
    address: { commune: 'Gombe', street: 'avenue des Aviateurs', landmark: 'à côté de la pharmacie du Centre' },
    parts: [part('patchi', 'prete', [item('Dragée Diet Almond Milk', '250 g', 60, 1, { ref: 'GNS0013' })], { startedAt: at(70), readyAt: at(8) })],
    payment: { method: 'mobile_money', provider: 'Airtel Money', status: 'paye', at: at(74), ref: 'AM-22014' },
    riderId: 'hn', assignedAt: at(6),
  },
  {
    number: 'KC-0139', createdAt: at(93), source: 'site',
    customer: { name: 'Christian Lukusa', phone: '+243 81 222 90 61' },
    mode: 'livraison', deliveryFee: 4,
    address: { commune: 'Gombe', street: 'avenue Tombalbaye', landmark: 'portail noir' },
    parts: [part('kyra', 'collectee', [item('Terre d’Hermès', 'Eau de toilette, 50 ml', 74, 1, { house: 'Hermès' })], { startedAt: at(90), readyAt: at(75) })],
    payment: { method: 'mobile_money', provider: 'M-Pesa', status: 'paye', at: at(93), ref: 'MP-47731' },
    riderId: 'jm', assignedAt: at(74), pickedUpAt: at(70), deliveredAt: at(52),
  },
  {
    number: 'KC-0137', createdAt: at(102), source: 'site',
    customer: { name: 'Ruth Kalala', phone: '+243 99 870 15 03' },
    mode: 'livraison', deliveryFee: 4,
    address: { commune: 'Gombe', street: 'avenue Kasa-Vubu', landmark: 'face à l’école' },
    parts: [part('patchi', 'annulee', [item('My Treat Assortiment', 'Boîte, 160 g', 41, 1, { ref: 'MYT0004' })])],
    payment: { method: 'mobile_money', provider: 'Orange Money', status: 'rembourse', at: at(102), ref: 'OM-90002' },
    cancelled: { reason: 'Client injoignable', at: at(80) },
  },
  {
    number: 'KC-0136', createdAt: at(110), source: 'site',
    customer: { name: 'Joseph Kasongo', phone: '+243 81 556 08 74' },
    mode: 'livraison', deliveryFee: 4,
    address: { commune: 'Gombe', street: 'avenue de la Paix', landmark: 'bâtiment SNEL' },
    parts: [part('patchi', 'collectee', [item('Chocolate Bar 100 g Finesse', 'Tablette, 100 g', 15, 2, { ref: 'GBR0001' })], { startedAt: at(108), readyAt: at(100) })],
    payment: { method: 'mobile_money', provider: 'M-Pesa', status: 'paye', at: at(110), ref: 'MP-47612' },
    riderId: 'gk', assignedAt: at(98), pickedUpAt: at(95), deliveredAt: at(80),
  },
]

// Ruptures signalées (alertes de la vue d'ensemble)
export const STOCK_ALERTS = [{ brand: 'kyra', product: 'Black Orchid, 150 ml', stock: 0 }]

// Produits utilisés par « Simuler une commande »
export const SIMULATION_ITEMS = [
  { brand: 'kyra', ...item('N°5 The Deodorant', 'Déodorant vaporisateur, 100 ml', 93, 1, { house: 'Chanel' }) },
  { brand: 'kyra', ...item('Miss Dior Parfum', 'Roller-perle 20 ml', 78, 1, { house: 'Dior' }) },
  { brand: 'patchi', ...item('Chocolate Milk Filled with Praline', '250 g', 24, 1, { ref: 'CCD01' }) },
  { brand: 'patchi', ...item('Chocolate Bar 100 g Audace', 'Tablette, 100 g', 15, 1, { ref: 'GBR0003' }) },
]
export const SIMULATION_CUSTOMERS = [
  { name: 'Prisca Lumbu', phone: '+243 81 404 12 77', street: 'avenue Lukusa', landmark: 'près de l’hôtel Memling' },
  { name: 'Cédric Ngoy', phone: '+243 99 512 63 20', street: 'avenue Wagenia', landmark: 'immeuble Crown, 5e' },
  { name: 'Esther Mbala', phone: '+243 82 330 47 15', street: 'boulevard du 30 Juin', landmark: 'galerie Sajir' },
]
