import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import * as controller from './notifications.controller.js'
import { emailParams, emailsQuery } from './notifications.schemas.js'

// Notifications des utilisateurs et des brands, file d'envoi des e-mails
export const notificationsRoutes = Router()

const admin = [requireAuth, requireRole('super_admin')]

notificationsRoutes.get('/emails', ...admin, validate({ query: emailsQuery }), controller.emails) // e-mails envoyés / en attente / en échec (?status=)
notificationsRoutes.post('/emails/:id/retry', ...admin, validate({ params: emailParams }), controller.retryEmail) // renvoyer un e-mail en échec
notificationsRoutes.get('/', requireAuth, requireRole('client', 'employe', 'livreur'), controller.list) // Mes notifications (et celles de ma brand)
notificationsRoutes.post('/:id/read', requireAuth, requireRole('client', 'employe', 'livreur'), controller.markRead) // Marquer comme lue
