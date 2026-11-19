import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import * as controller from './notifications.controller.js'

// Notifications des utilisateurs et des brands
export const notificationsRoutes = Router()

notificationsRoutes.get('/', requireAuth, requireRole('client', 'employe', 'livreur'), controller.list) // Mes notifications (et celles de ma brand)
notificationsRoutes.post('/:id/read', requireAuth, requireRole('client', 'employe', 'livreur'), controller.markRead) // Marquer comme lue
