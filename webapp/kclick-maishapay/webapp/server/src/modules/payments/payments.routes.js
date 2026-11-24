import express, { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import { paymentStartLimiter } from '../../middlewares/rateLimit.js'
import * as controller from './payments.controller.js'
import { confirmBody, failBody, listQuery, paymentParams, providerParams, startBody, statusParams, statusQuery } from './payments.schemas.js'

// Paiements : en ligne avec MaishaPay (client), suivi et remboursements (super-admin)
export const paymentsRoutes = Router()

const admin = [requireAuth, requireRole('super_admin')]

// Client (avec ou sans compte) : numéro de commande + téléphone de la commande
paymentsRoutes.post('/start', paymentStartLimiter, validate({ body: startBody }), controller.start)                 // lancer / relancer le paiement
paymentsRoutes.get('/status/:number', validate({ params: statusParams, query: statusQuery }), controller.status)  // où en est le paiement ?

// MaishaPay : résultat d'un paiement (non signé : toujours revérifié auprès de MaishaPay avant de compter)
// (corps JSON, ou formulaire si MaishaPay l'envoie ainsi)
paymentsRoutes.post('/webhooks/:provider', express.urlencoded({ extended: false, limit: '50kb' }), validate({ params: providerParams }), controller.webhook) // mobile money
paymentsRoutes.get('/webhooks/:provider', validate({ params: providerParams }), controller.webhookReturn)        // carte : retour du client

// Super-admin
paymentsRoutes.get('/', ...admin, validate({ query: listQuery }), controller.list)                                // ?status=&kind=&q=
paymentsRoutes.get('/refunds', ...admin, validate({ query: listQuery }), controller.refunds)                      // remboursements à faire
paymentsRoutes.post('/refunds/:id/done', ...admin, validate({ params: paymentParams, body: confirmBody }), controller.refundDone)
paymentsRoutes.post('/:id/confirm', ...admin, validate({ params: paymentParams, body: confirmBody }), controller.confirm) // paiement reçu (vérifié à la main)
paymentsRoutes.post('/:id/fail', ...admin, validate({ params: paymentParams, body: failBody }), controller.fail)          // paiement échoué
