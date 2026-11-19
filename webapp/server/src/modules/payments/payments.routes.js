import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import * as controller from './payments.controller.js'

// Paiements et remboursements
export const paymentsRoutes = Router()

paymentsRoutes.post('/webhooks/:provider', controller.webhook) // Confirmation envoyée par le prestataire (mobile money, carte)
paymentsRoutes.get('/refunds', requireAuth, requireRole('super_admin'), controller.refunds) // Remboursements à traiter
paymentsRoutes.post('/refunds/:id/done', requireAuth, requireRole('super_admin'), controller.refundDone) // Marquer un remboursement comme fait
