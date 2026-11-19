import { Router } from 'express'
import { optionalAuth, requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import { orderLimiter } from '../../middlewares/rateLimit.js'
import * as controller from './orders.controller.js'
import { cancelBody, createOrderBody, listQuery, mineQuery, orderParams, trackParams, trackQuery } from './orders.schemas.js'

export const ordersRoutes = Router()

ordersRoutes.post('/', orderLimiter, optionalAuth, validate({ body: createOrderBody }), controller.create) // checkout (avec ou sans compte)
ordersRoutes.get('/', requireAuth, requireRole('super_admin'), validate({ query: listQuery }), controller.list) // toutes les commandes (?tab=&search=&date=today)
ordersRoutes.get('/mine', requireAuth, validate({ query: mineQuery }), controller.mine)                    // « mes commandes » (?tab=en_cours…)
ordersRoutes.get('/track/:number', orderLimiter, validate({ params: trackParams, query: trackQuery }), controller.track) // suivi sans compte (?phone=)
ordersRoutes.get('/:id', requireAuth, validate({ params: orderParams }), controller.show)                  // détail selon le rôle
ordersRoutes.post('/:id/cancel', requireAuth, validate({ params: orderParams, body: cancelBody }), controller.cancel)
ordersRoutes.post('/:id/handover', requireAuth, requireRole('employe'), validate({ params: orderParams }), controller.handover) // retrait remis au client
