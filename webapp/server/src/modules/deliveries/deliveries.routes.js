import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import * as controller from './deliveries.controller.js'
import { assignBody, availabilityBody, collectBody, orderParams } from './deliveries.schemas.js'

// Livraisons : dispatch (super-admin, employés) et courses du livreur
export const deliveriesRoutes = Router()

deliveriesRoutes.get('/riders', requireAuth, requireRole('employe'), controller.riders) // livreurs et leur course en cours
deliveriesRoutes.post('/', requireAuth, requireRole('employe'), validate({ body: assignBody }), controller.assign) // assigner (une part prête suffit)
deliveriesRoutes.get('/mine', requireAuth, requireRole('livreur'), controller.mine) // mes courses
deliveriesRoutes.patch('/me/availability', requireAuth, requireRole('livreur'), validate({ body: availabilityBody }), controller.availability)
deliveriesRoutes.post('/:orderId/collect', requireAuth, requireRole('livreur'), validate({ params: orderParams, body: collectBody }), controller.collect) // part récupérée
deliveriesRoutes.post('/:orderId/delivered', requireAuth, requireRole('livreur'), validate({ params: orderParams }), controller.delivered) // remise au client
