import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import * as controller from './brands.controller.js'
import { hoursBody, slugParams, updateBody } from './brands.schemas.js'

// Maisons : ouverture (« bientôt disponible »), point de retrait, horaires
export const brandsRoutes = Router()

brandsRoutes.get('/', controller.list)                                                                       // public
brandsRoutes.get('/:slug', validate({ params: slugParams }), controller.get)                                // public
brandsRoutes.patch('/:slug', requireAuth, requireRole('super_admin'), validate({ params: slugParams, body: updateBody }), controller.update)
brandsRoutes.get('/:slug/hours', validate({ params: slugParams }), controller.hours)                       // public
brandsRoutes.put('/:slug/hours', requireAuth, requireRole('employe'), validate({ params: slugParams, body: hoursBody }), controller.updateHours) // sa Maison (ou super admin)
