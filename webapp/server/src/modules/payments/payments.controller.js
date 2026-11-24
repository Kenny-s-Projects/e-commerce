import { env } from '../../config/env.js'
import * as service from './payments.service.js'

export const list = async (req, res) => res.json(await service.list(req.valid.query))
export const confirm = async (req, res) => res.json(await service.confirm(req.user, req.valid.params.id, req.valid.body))
export const fail = async (req, res) => res.json(await service.fail(req.user, req.valid.params.id, req.valid.body))
export const refunds = async (req, res) => res.json(await service.refunds(req.valid.query))
export const refundDone = async (req, res) => res.json(await service.refundDone(req.user, req.valid.params.id, req.valid.body))

// Paiement en ligne (client, avec ou sans compte : numéro de commande + téléphone)
export const start = async (req, res) => res.json(await service.startPayment(req.valid.body))
export const status = async (req, res) => res.json(await service.paymentStatus({ number: req.valid.params.number, phone: req.valid.query.phone }))

// Message de MaishaPay. Mobile money : POST, on répond 200 (même si le paiement est inconnu, pour éviter les renvois).
export const webhook = async (req, res) => {
  const result = await service.webhook(req.valid.params.provider, req)
  res.json({ received: true, ok: result.ok })
}

// Carte : le client revient du paiement sécurisé par cette adresse (GET) → vérification, puis suivi de sa commande
export const webhookReturn = async (req, res) => {
  const result = await service.webhook(req.valid.params.provider, req).catch(() => ({ orderNumber: null }))
  res.redirect(302, `${env.PUBLIC_SITE_URL}/#suivi${result.orderNumber ? `/${result.orderNumber}` : ''}`)
}
