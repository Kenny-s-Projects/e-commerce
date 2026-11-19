// Clients de démonstration : ceux des commandes du jour (data/demo.js) et quelques habitués.
// Une commande est rattachée à un client par son numéro de téléphone.
// pastOrders : commandes des jours précédents (résumé), pour les statistiques.
import { orderTotal } from '../lib/format.js'

const day = (daysAgo, h = 11) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, 0, 0, 0)
  return d.toISOString()
}

const gombe = (street, landmark, label = 'Domicile') => ({ label, commune: 'Gombe', street, landmark })

export const CLIENTS = [
  { id: 'merveille-kabongo', firstName: 'Merveille', lastName: 'Kabongo', email: 'merveille.kabongo@exemple.com', phone: '+243 81 000 00 00', lang: 'fr', createdAt: day(68), hasAccount: true, newsletter: true,
    addresses: [gombe('avenue de la Justice', 'près du rond-point Socimat, portail bleu'), gombe('boulevard du 30 Juin', 'immeuble Kiyo, 4e étage', 'Bureau')],
    notes: 'Préfère être appelée avant la livraison.', pastOrders: [{ at: day(7), total: 96, brand: 'kyra' }, { at: day(16), total: 45, brand: 'patchi' }] },
  { id: 'daniel-mutombo', firstName: 'Daniel', lastName: 'Mutombo', email: 'daniel.mutombo@exemple.com', phone: '+243 81 455 20 19', lang: 'fr', createdAt: day(40), hasAccount: true, newsletter: false,
    addresses: [gombe('boulevard du 30 Juin', 'immeuble face à la BCDC', 'Bureau')], notes: '', pastOrders: [{ at: day(12), total: 119, brand: 'kyra' }] },
  { id: 'nadine-mpiana', firstName: 'Nadine', lastName: 'Mpiana', email: 'nadine.mpiana@exemple.com', phone: '+243 82 214 55 10', lang: 'fr', createdAt: day(9), hasAccount: true, newsletter: true,
    addresses: [gombe('avenue Colonel Ebeya', 'immeuble Les Palmiers, 3e étage')], notes: '', pastOrders: [] },
  { id: 'josue-kanku', firstName: 'Josué', lastName: 'Kanku', email: 'josue.kanku@exemple.com', phone: '+243 99 120 33 41', lang: 'fr', createdAt: day(0, 8), hasAccount: false, newsletter: false,
    addresses: [], notes: '', pastOrders: [] },
  { id: 'patrick-ilunga', firstName: 'Patrick', lastName: 'Ilunga', email: 'patrick.ilunga@exemple.com', phone: '+243 97 300 11 08', lang: 'en', createdAt: day(120), hasAccount: true, newsletter: false,
    addresses: [gombe('avenue Lumumba', 'à côté de la station Total')], notes: 'Retire toujours en boutique.', pastOrders: [{ at: day(30), total: 163, brand: 'patchi' }, { at: day(58), total: 72, brand: 'patchi' }] },
  { id: 'grace-mbuyi', firstName: 'Grâce', lastName: 'Mbuyi', email: 'grace.mbuyi@exemple.com', phone: '+243 81 770 42 90', lang: 'fr', createdAt: day(25), hasAccount: true, newsletter: true,
    addresses: [gombe('avenue du Port', 'résidence Fleuve, entrée B')], notes: '', pastOrders: [{ at: day(14), total: 101, brand: 'kyra' }] },
  { id: 'sarah-tshibangu', firstName: 'Sarah', lastName: 'Tshibangu', email: 'sarah.tshibangu@exemple.com', phone: '+243 84 601 77 32', lang: 'fr', createdAt: day(3), hasAccount: false, newsletter: false,
    addresses: [], notes: '', pastOrders: [] },
  { id: 'christian-lukusa', firstName: 'Christian', lastName: 'Lukusa', email: 'christian.lukusa@exemple.com', phone: '+243 81 222 90 61', lang: 'fr', createdAt: day(84), hasAccount: true, newsletter: false,
    addresses: [gombe('avenue Tombalbaye', 'portail noir')], notes: '', pastOrders: [{ at: day(21), total: 78, brand: 'kyra' }] },
  { id: 'ruth-kalala', firstName: 'Ruth', lastName: 'Kalala', email: 'ruth.kalala@exemple.com', phone: '+243 99 870 15 03', lang: 'fr', createdAt: day(1), hasAccount: false, newsletter: false,
    addresses: [], notes: 'Injoignable le 1er essai : laisser un message WhatsApp.', pastOrders: [] },
  { id: 'joseph-kasongo', firstName: 'Joseph', lastName: 'Kasongo', email: 'joseph.kasongo@exemple.com', phone: '+243 81 556 08 74', lang: 'fr', createdAt: day(150), hasAccount: true, newsletter: true,
    addresses: [gombe('avenue de la Paix', 'bâtiment SNEL')], notes: '', pastOrders: [{ at: day(4), total: 34, brand: 'patchi' }, { at: day(19), total: 64, brand: 'patchi' }, { at: day(40), total: 93, brand: 'kyra' }] },
  // Habitués sans commande aujourd'hui
  { id: 'aurore-lukeba', firstName: 'Aurore', lastName: 'Lukeba', email: 'aurore.lukeba@exemple.com', phone: '+243 81 902 44 18', lang: 'fr', createdAt: day(200), hasAccount: true, newsletter: true,
    addresses: [gombe('avenue Wagenia', 'immeuble Crown, 5e')], notes: 'Cliente fidèle Kyra, achète souvent des coffrets cadeaux.', pastOrders: [{ at: day(2), total: 212, brand: 'kyra' }, { at: day(33), total: 178, brand: 'kyra' }, { at: day(61), total: 96, brand: 'patchi' }] },
  { id: 'kevin-mbemba', firstName: 'Kevin', lastName: 'Mbemba', email: 'kevin.mbemba@exemple.com', phone: '+243 99 340 72 55', lang: 'en', createdAt: day(18), hasAccount: true, newsletter: false,
    addresses: [gombe('avenue Kalemie', 'hôtel Memling, réception', 'Hôtel')], notes: '', pastOrders: [{ at: day(18), total: 140, brand: 'adidas' }] },
  { id: 'prisca-lumbu', firstName: 'Prisca', lastName: 'Lumbu', email: 'prisca.lumbu@exemple.com', phone: '+243 81 404 12 77', lang: 'fr', createdAt: day(6), hasAccount: true, newsletter: true,
    addresses: [gombe('avenue Lukusa', 'près de l’hôtel Memling')], notes: '', pastOrders: [{ at: day(6), total: 117, brand: 'kyra' }] },
  { id: 'cedric-ngoy', firstName: 'Cédric', lastName: 'Ngoy', email: 'cedric.ngoy@exemple.com', phone: '+243 99 512 63 20', lang: 'fr', createdAt: day(45), hasAccount: false, newsletter: false,
    addresses: [], notes: '', pastOrders: [{ at: day(45), total: 59, brand: 'celio' }] },
  { id: 'esther-mbala', firstName: 'Esther', lastName: 'Mbala', email: 'esther.mbala@exemple.com', phone: '+243 82 330 47 15', lang: 'fr', createdAt: day(11), hasAccount: true, newsletter: true,
    addresses: [gombe('boulevard du 30 Juin', 'galerie Sajir')], notes: '', pastOrders: [{ at: day(11), total: 48, brand: 'patchi' }] },
  { id: 'samuel-ekofo', firstName: 'Samuel', lastName: 'Ekofo', email: 'samuel.ekofo@exemple.com', phone: '+243 97 118 06 39', lang: 'fr', createdAt: day(95), hasAccount: true, newsletter: false,
    addresses: [gombe('avenue des Aviateurs', 'ambassade, guérite')], notes: '', pastOrders: [{ at: day(27), total: 85, brand: 'celio' }, { at: day(70), total: 120, brand: 'adidas' }] },
]

export const fullName = (c) => `${c.firstName} ${c.lastName}`

const digits = (phone) => phone.replace(/\D/g, '')

/** Commandes du jour d'un client (rattachées par téléphone), les plus récentes d'abord */
export const ordersOf = (client, orders) =>
  orders
    .filter((o) => digits(o.customer.phone) === digits(client.phone))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

/**
 * Statistiques d'un client : commandes (du jour + passées), total dépensé hors annulées,
 * dernière commande, Maison préférée (la plus dépensée).
 */
export function statsOf(client, orders) {
  const today = ordersOf(client, orders).filter((o) => !o.cancelled)
  const lines = [
    ...client.pastOrders,
    ...today.map((o) => ({
      at: o.createdAt,
      total: orderTotal(o),
      brand: o.parts.slice().sort((a, b) => b.items.length - a.items.length)[0]?.brand,
    })),
  ]
  const byBrand = {}
  for (const l of lines) byBrand[l.brand] = (byBrand[l.brand] ?? 0) + l.total
  const favourite = Object.entries(byBrand).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const spent = lines.reduce((acc, l) => acc + l.total, 0)
  const lastAt = lines.map((l) => l.at).sort().at(-1) ?? null
  return { count: lines.length, spent, lastAt, favourite, average: lines.length ? spent / lines.length : 0 }
}

export const LANGS = { fr: 'Français', en: 'English' }
