import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import * as controller from './brands.controller.js'

// Brands : fiches, horaires, point de retrait
export const brandsRoutes = Router()

brandsRoutes.get('/', controller.list) // Liste des brands (public)
brandsRoutes.get('/:slug/hours', controller.hours) // Horaires et heure limite du jour (public)
brandsRoutes.put('/:slug/hours', requireAuth, requireRole('employe'), controller.updateHours) // Modifier les horaires (sa brand)
