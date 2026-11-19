import { Router } from 'express'
import { optionalAuth, requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { orderLimiter } from '../../middlewares/rateLimit.js'
import * as controller from './orders.controller.js'
import { cancelBody, createOrderBody, mineQuery, orderParams } from './orders.schemas.js'

export const ordersRoutes = Router()

ordersRoutes.post('/', orderLimiter, optionalAuth, validate({ body: createOrderBody }), controller.create) // checkout (avec ou sans compte)
ordersRoutes.get('/mine', requireAuth, validate({ query: mineQuery }), controller.mine)                    // « mes commandes » (?tab=en_cours…)
ordersRoutes.get('/:id', requireAuth, validate({ params: orderParams }), controller.show)                  // détail selon le rôle
ordersRoutes.post('/:id/cancel', requireAuth, validate({ params: orderParams, body: cancelBody }), controller.cancel)
