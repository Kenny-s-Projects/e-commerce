// E-mails liés aux commandes. Chaque fonction reçoit une commande « forme dashboard »
// (orders.present.js) et renvoie { subject, html, text }. Français par défaut, anglais si le compte client est en anglais.
import { env } from '../../../config/env.js'
import { box, button, esc, itemsTable, layout, money, orderNumber, p, title } from './layout.js'

const T = {
  fr: {
    subtotal: 'Sous-total',
    delivery: 'Livraison à Gombe',
    pickupFee: 'Retrait en boutique',
    total: 'Total',
    track: 'Suivre ma commande',
    deliverTo: 'Livraison à',
    pickupAt: 'Retrait en boutique',
    landmark: 'Repère',
    paid: 'Payée en ligne',
    pending: 'Paiement en attente de confirmation',
    refunded: 'Remboursée',
    method: { mobile_money: 'mobile money', carte: 'carte bancaire' },
    hello: (n) => `Bonjour ${n},`,
  },
  en: {
    subtotal: 'Subtotal',
    delivery: 'Delivery in Gombe',
    pickupFee: 'In-store pickup',
    total: 'Total',
    track: 'Track my order',
    deliverTo: 'Delivery to',
    pickupAt: 'In-store pickup',
    landmark: 'Landmark',
    paid: 'Paid online',
    pending: 'Payment awaiting confirmation',
    refunded: 'Refunded',
    method: { mobile_money: 'mobile money', carte: 'card' },
    hello: (n) => `Hello ${n},`,
  },
}

const t = (lang) => T[lang] ?? T.fr
const firstName = (name) => String(name ?? '').trim().split(/\s+/)[0] || ''
const trackUrl = (order) => `${env.PUBLIC_SITE_URL}/#suivi/${encodeURIComponent(order.number)}`
const active = (part) => part.status !== 'refusee' && part.status !== 'annulee'

function lines(order) {
  return order.parts.flatMap((part) =>
    part.items.map((i) => ({ name: i.name, detail: [part.brandName, i.detail].filter(Boolean).join(' · '), qty: i.qty, price: i.price, struck: !active(part) })),
  )
}

function totals(order, lang) {
  const tr = t(lang)
  const sub = order.parts.filter(active).reduce((acc, part) => acc + part.items.reduce((s, i) => s + i.price * i.qty, 0), 0)
  return [
    { label: tr.subtotal, amount: sub },
    { label: order.mode === 'livraison' ? tr.delivery : tr.pickupFee, amount: order.mode === 'livraison' ? order.deliveryFee : 0 },
    { label: tr.total, amount: order.adjustedTotal ?? order.total, strong: true },
  ]
}

function destination(order, lang) {
  const tr = t(lang)
  if (order.mode === 'retrait') {
    const where = [order.pickup?.name, order.pickup?.address].filter(Boolean).map(esc).join(', ')
    return box(`<strong>${tr.pickupAt}</strong><br>${where || 'Gombe'}`)
  }
  const a = order.address ?? {}
  const street = [a.street, a.quartier, a.commune].filter(Boolean).map(esc).join(', ')
  return box(`<strong>${tr.deliverTo}</strong> ${esc(order.customer.name)}<br>${street}${a.landmark ? `<br>${tr.landmark} : ${esc(a.landmark)}` : ''}`)
}

function paymentLine(order, lang) {
  const tr = t(lang)
  const pay = order.payment
  if (!pay) return ''
  const status = pay.status === 'paye' ? tr.paid : pay.status === 'rembourse' ? tr.refunded : tr.pending
  const method = [tr.method[pay.method] ?? pay.method, pay.provider].filter(Boolean).join(' · ')
  return p(`${esc(status)} (${esc(method)})`, 'font-size:13px;')
}

function textItems(order) {
  return lines(order)
    .map((l) => `${l.struck ? '[indisponible] ' : ''}${l.qty} × ${l.name}${l.detail ? ` (${l.detail})` : ''} : ${money(l.price * l.qty)}`)
    .join('\n')
}

function build({ lang, subject, preheader, heading, intro, order, extra = '', cta = true }) {
  const tr = t(lang)
  const html = layout({
    lang,
    preheader,
    body: `${orderNumber(order.number)}${title(heading)}${intro.map((x) => p(x)).join('')}${extra}${itemsTable(lines(order), totals(order, lang))}${destination(order, lang)}${paymentLine(order, lang)}${cta ? button(trackUrl(order), tr.track) : ''}`,
  })
  const text = [
    `kclick · ${order.number}`,
    heading,
    ...intro.map((x) => x.replace(/<[^>]+>/g, '')),
    '',
    textItems(order),
    `${tr.total} : ${money(order.adjustedTotal ?? order.total)}`,
    '',
    cta ? `${tr.track} : ${trackUrl(order)}` : '',
  ].join('\n')
  return { subject, html, text }
}

/* ---------- Client ---------- */

export function orderConfirmation(order, { lang = 'fr' } = {}) {
  const name = esc(firstName(order.customer.name))
  return lang === 'en'
    ? build({ lang, order, subject: `Order ${order.number} received`, preheader: 'Thank you, your order is confirmed.', heading: 'Thank you, your order is received.', intro: [`${t(lang).hello(name)}`, 'The House is preparing it. We will let you know at every step.'] })
    : build({ lang, order, subject: `Commande ${order.number} reçue`, preheader: 'Merci, votre commande est bien enregistrée.', heading: 'Merci, votre commande est bien reçue.', intro: [`${t(lang).hello(name)}`, 'La Maison la prépare. Nous vous prévenons à chaque étape.'] })
}

export function paymentReceived(order, { lang = 'fr' } = {}) {
  return lang === 'en'
    ? build({ lang, order, subject: `Payment received for ${order.number}`, preheader: 'Your payment is confirmed.', heading: 'Your payment is confirmed.', intro: [`${t(lang).hello(esc(firstName(order.customer.name)))}`, 'We have received your payment. Your order continues.'] })
    : build({ lang, order, subject: `Paiement reçu pour ${order.number}`, preheader: 'Votre paiement est confirmé.', heading: 'Votre paiement est confirmé.', intro: [`${t(lang).hello(esc(firstName(order.customer.name)))}`, 'Nous avons bien reçu votre paiement. Votre commande suit son cours.'] })
}

/** Une Maison n'a pas pu préparer sa part : ce qui manque, pourquoi, nouveau total, remboursement, annulation possible */
export function partRefused(order, { lang = 'fr', brandName, reason, paid = false } = {}) {
  const missing = order.parts
    .filter((part) => part.brandName === brandName || !active(part))
    .flatMap((part) => part.items.map((i) => `${i.qty} × ${esc(i.name)}${i.detail ? ` (${esc(i.detail)})` : ''}`))
  const stillActive = order.parts.some(active)
  const name = esc(firstName(order.customer.name))
  if (lang === 'en') {
    return build({
      lang,
      order,
      subject: stillActive ? `Order ${order.number} updated` : `Order ${order.number} could not be prepared`,
      preheader: `${brandName} could not prepare part of your order.`,
      heading: stillActive ? 'Your order continues, with a change.' : 'We are sorry, your order could not be prepared.',
      intro: [
        t(lang).hello(name),
        `${esc(brandName)} could not prepare: ${missing.join(', ')}${reason ? ` (${esc(reason)})` : ''}.`,
        stillActive ? `New total: <strong style="color:#141414;">${money(order.adjustedTotal)}</strong>.` : 'Your order is cancelled.',
        paid ? 'The difference will be refunded to you.' : '',
        stillActive ? 'If you no longer want the rest, you can still cancel the whole order before it leaves for delivery.' : '',
      ].filter(Boolean),
    })
  }
  return build({
    lang,
    order,
    subject: stillActive ? `Commande ${order.number} modifiée` : `Commande ${order.number} non préparée`,
    preheader: `${brandName} n’a pas pu préparer une partie de votre commande.`,
    heading: stillActive ? 'Votre commande continue, avec un changement.' : 'Désolés, votre commande n’a pas pu être préparée.',
    intro: [
      t(lang).hello(name),
      `${esc(brandName)} n’a pas pu préparer : ${missing.join(', ')}${reason ? ` (${esc(reason)})` : ''}.`,
      stillActive ? `Nouveau total : <strong style="color:#141414;">${money(order.adjustedTotal)}</strong>.` : 'Votre commande est annulée.',
      paid ? 'La différence vous sera remboursée.' : '',
      stillActive ? 'Si vous ne souhaitez plus le reste, vous pouvez encore annuler toute la commande avant son départ en livraison.' : '',
    ].filter(Boolean),
  })
}

export function readyForPickup(order, { lang = 'fr' } = {}) {
  return lang === 'en'
    ? build({ lang, order, subject: `Order ${order.number} is ready`, preheader: 'Your order is waiting for you in store.', heading: 'Your order is ready in store.', intro: [t(lang).hello(esc(firstName(order.customer.name))), 'Come and collect it with your order number.'] })
    : build({ lang, order, subject: `Commande ${order.number} prête`, preheader: 'Votre commande vous attend en boutique.', heading: 'Votre commande vous attend en boutique.', intro: [t(lang).hello(esc(firstName(order.customer.name))), 'Venez la récupérer avec votre numéro de commande.'] })
}

export function onTheWay(order, { lang = 'fr', riderFirstName, eta } = {}) {
  const rider = riderFirstName ? esc(riderFirstName) : null
  if (lang === 'en') {
    return build({ lang, order, subject: `Order ${order.number} is on its way`, preheader: 'Your order is on its way.', heading: 'Your order is on its way.', intro: [t(lang).hello(esc(firstName(order.customer.name))), `${rider ? `${rider} is bringing it by motorbike` : 'Our courier is bringing it by motorbike'}${eta ? `, estimated arrival in about ${Number(eta)} min` : ''}.`] })
  }
  return build({ lang, order, subject: `Commande ${order.number} en route`, preheader: 'Votre commande est en route.', heading: 'Votre commande est en route.', intro: [t(lang).hello(esc(firstName(order.customer.name))), `${rider ? `${rider} vous l’apporte à moto` : 'Notre livreur vous l’apporte à moto'}${eta ? `, arrivée estimée dans environ ${Number(eta)} min` : ''}.`] })
}

export function delivered(order, { lang = 'fr' } = {}) {
  const pickup = order.mode === 'retrait'
  if (lang === 'en') {
    return build({ lang, order, cta: false, subject: pickup ? `Order ${order.number} collected` : `Order ${order.number} delivered`, preheader: 'Thank you for your order.', heading: pickup ? 'Your order has been collected.' : 'Your order has been delivered.', intro: [t(lang).hello(esc(firstName(order.customer.name))), 'Thank you for choosing kclick. We hope to see you again soon.'] })
  }
  return build({ lang, order, cta: false, subject: pickup ? `Commande ${order.number} retirée` : `Commande ${order.number} livrée`, preheader: 'Merci pour votre commande.', heading: pickup ? 'Votre commande a été retirée.' : 'Votre commande a été livrée.', intro: [t(lang).hello(esc(firstName(order.customer.name))), 'Merci d’avoir choisi kclick. À très bientôt.'] })
}

export function cancelled(order, { lang = 'fr', reason, refund = 0 } = {}) {
  if (lang === 'en') {
    return build({ lang, order, cta: false, subject: `Order ${order.number} cancelled`, preheader: 'Your order has been cancelled.', heading: 'Your order has been cancelled.', intro: [t(lang).hello(esc(firstName(order.customer.name))), reason ? `Reason: ${esc(reason)}.` : '', refund > 0 ? `A refund of ${money(refund)} will be made to you.` : ''].filter(Boolean) })
  }
  return build({ lang, order, cta: false, subject: `Commande ${order.number} annulée`, preheader: 'Votre commande a été annulée.', heading: 'Votre commande a été annulée.', intro: [t(lang).hello(esc(firstName(order.customer.name))), reason ? `Motif : ${esc(reason)}.` : '', refund > 0 ? `Un remboursement de ${money(refund)} vous sera fait.` : ''].filter(Boolean) })
}

/* ---------- Équipe ---------- */

/** Alerte « nouvelle commande » pour l'équipe (toujours en français) */
export function teamNewOrder(order) {
  const dashboard = `${env.PUBLIC_SITE_URL}/#admin/commandes/${encodeURIComponent(order.number)}`
  const brands = [...new Set(order.parts.map((part) => part.brandName))].join(', ')
  const html = layout({
    lang: 'fr',
    preheader: `${order.customer.name} · ${money(order.total)} · ${brands}`,
    body: `${orderNumber(order.number)}${title('Nouvelle commande')}${p(
      `${esc(order.customer.name)} · <span style="font-family:'JetBrains Mono',Consolas,monospace;color:#141414;">${esc(order.customer.phone)}</span>${order.customer.email ? ` · ${esc(order.customer.email)}` : ''}`,
    )}${p(`${esc(brands)} · ${order.mode === 'livraison' ? 'Livraison' : 'Retrait en boutique'}`)}${order.note ? box(`Note du client : ${esc(order.note)}`) : ''}${itemsTable(lines(order), totals(order, 'fr'))}${destination(order, 'fr')}${paymentLine(order, 'fr')}${button(dashboard, 'Ouvrir dans le dashboard')}`,
  })
  const text = [
    `Nouvelle commande ${order.number}`,
    `${order.customer.name} · ${order.customer.phone}`,
    `${brands} · ${order.mode}`,
    '',
    textItems(order),
    `Total : ${money(order.total)}`,
    '',
    `Dashboard : ${dashboard}`,
  ].join('\n')
  return { subject: `Nouvelle commande ${order.number} · ${money(order.total)}`, html, text }
}
