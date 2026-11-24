import { events } from '../../shared/events.js'
import { logger } from '../../config/logger.js'
import { findOrderRow } from '../orders/orders.model.js'
import { presentOrder } from '../orders/orders.present.js'
import * as model from './notifications.model.js'
import { queueEmail } from './notifications.service.js'
import * as orderEmails from './templates/orders.js'
import { isOnlineMethod } from '../payments/payments.service.js'
import { invitation } from './templates/invitation.js'

/*
 * E-mails envoyés selon les événements (voir README « E-mails (Resend) »).
 * Les réglages Paramètres › Notifications décident de ce qui part (customerEmails, teamRecipients).
 * Une rupture et une annulation sont toujours signalées au client.
 */

const DEFAULTS = {
  customerEmails: { confirmation: true, ready: true, onTheWay: true, delivered: true },
  teamRecipients: ['ecommerce@kennysinternational.com'],
}

async function settings() {
  const s = (await model.findNotificationSettings()) ?? {}
  return {
    customerEmails: { ...DEFAULTS.customerEmails, ...(s.customerEmails ?? {}) },
    teamRecipients: Array.isArray(s.teamRecipients) ? s.teamRecipients : DEFAULTS.teamRecipients,
  }
}

/** Commande + destinataire client : e-mail saisi au checkout, sinon celui du compte ; langue du compte */
async function context(orderId) {
  const row = await findOrderRow(orderId)
  if (!row) return null
  const order = presentOrder(row)
  const profile = await model.findCustomerProfile(order.customerId)
  return { order, to: order.customer.email || profile?.email || null, lang: profile?.lang === 'en' ? 'en' : 'fr' }
}

async function toCustomer(kind, orderId, render) {
  const ctx = await context(orderId)
  if (!ctx?.to) return
  const mail = render(ctx.order, ctx.lang)
  await queueEmail({ kind, to: ctx.to, orderId, ...mail })
}

const paidOrRefunding = (order) => order.payment?.status === 'paye' || order.refundPending > 0

// « Nouvelle commande » pour l'équipe : à la commande si le paiement se confirme à la main (l'équipe doit le vérifier),
// sinon (paiement en ligne MaishaPay) seulement une fois le paiement confirmé, comme pour les Maisons.
async function notifyTeam(orderId, ctx) {
  const s = await settings()
  const team = orderEmails.teamNewOrder(ctx.order)
  for (const to of new Set(s.teamRecipients.map((e) => String(e).trim().toLowerCase()).filter(Boolean))) {
    await queueEmail({ kind: 'team_new_order', to, orderId, ...team })
  }
}

events.on('order.created', async ({ orderId }) => {
  const s = await settings()
  const ctx = await context(orderId)
  if (!ctx) return
  if (s.customerEmails.confirmation && ctx.to) await queueEmail({ kind: 'order_confirmation', to: ctx.to, orderId, ...orderEmails.orderConfirmation(ctx.order, { lang: ctx.lang }) })
  if (!isOnlineMethod(ctx.order.payment?.method)) await notifyTeam(orderId, ctx)
})

events.on('payment.confirmed', async ({ orderId }) => {
  await toCustomer('payment_received', orderId, (order, lang) => orderEmails.paymentReceived(order, { lang }))
  const ctx = await context(orderId)
  if (ctx && isOnlineMethod(ctx.order.payment?.method)) await notifyTeam(orderId, ctx)
})

events.on('part.refused', async ({ orderId, brand, reason, refund }) => {
  await toCustomer('part_refused', orderId, (order, lang) => {
    const brandName = order.parts.find((p) => p.brand === brand)?.brandName ?? brand
    return orderEmails.partRefused(order, { lang, brandName, reason, paid: refund > 0 || paidOrRefunding(order) })
  })
})

// Retrait : quand toutes les parts actives sont prêtes, le client peut venir
events.on('part.ready', async ({ orderId }) => {
  const s = await settings()
  if (!s.customerEmails.ready) return
  const ctx = await context(orderId)
  if (!ctx?.to || ctx.order.mode !== 'retrait') return
  const activeParts = ctx.order.parts.filter((p) => p.status !== 'refusee' && p.status !== 'annulee')
  if (!activeParts.length || !activeParts.every((p) => p.status === 'prete')) return
  await queueEmail({ kind: 'ready_for_pickup', to: ctx.to, orderId, ...orderEmails.readyForPickup(ctx.order, { lang: ctx.lang }) })
})

events.on('delivery.picked_up', async ({ orderId }) => {
  if (!(await settings()).customerEmails.onTheWay) return
  await toCustomer('on_the_way', orderId, (order, lang) =>
    orderEmails.onTheWay(order, { lang, riderFirstName: order.riderName?.split(/\s+/)[0], eta: order.eta }),
  )
})

for (const name of ['delivery.delivered', 'order.picked_up']) {
  events.on(name, async ({ orderId }) => {
    if (!(await settings()).customerEmails.delivered) return
    await toCustomer('delivered', orderId, (order, lang) => orderEmails.delivered(order, { lang }))
  })
}

events.on('order.cancelled', async ({ orderId, reason, refund }) => {
  await toCustomer('order_cancelled', orderId, (order, lang) => orderEmails.cancelled(order, { lang, reason, refund }))
})

// Invitation d'un membre de l'équipe (création ou renvoi)
events.on('user.invited', async ({ email, firstName, role, brandName }) => {
  if (!email) return
  await queueEmail({ kind: 'invitation', to: email, ...invitation({ email, firstName, role, brandName }) })
  logger.info({ role }, 'Invitation équipe mise en file d’envoi')
})
