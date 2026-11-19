import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import * as controller from './payments.controller.js'
import { confirmBody, failBody, listQuery, paymentParams, providerParams } from './payments.schemas.js'

// Paiements et remboursements (super-admin), confirmations des prestataires
export const paymentsRoutes = Router()

const admin = [requireAuth, requireRole('super_admin')]

paymentsRoutes.post('/webhooks/:provider', validate({ params: providerParams }), controller.webhook)              // prestataire (à brancher)
paymentsRoutes.get('/', ...admin, validate({ query: listQuery }), controller.list)                                // ?status=en_attente&kind=paiement
paymentsRoutes.get('/refunds', ...admin, validate({ query: listQuery }), controller.refunds)                      // remboursements à faire
paymentsRoutes.post('/refunds/:id/done', ...admin, validate({ params: paymentParams, body: confirmBody }), controller.refundDone)
paymentsRoutes.post('/:id/confirm', ...admin, validate({ params: paymentParams, body: confirmBody }), controller.confirm) // paiement reçu
paymentsRoutes.post('/:id/fail', ...admin, validate({ params: paymentParams, body: failBody }), controller.fail)          // paiement échoué
