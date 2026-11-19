import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import * as service from './clients.service.js'

// Clients (super admin) : avec compte ou sans compte, regroupés à partir des commandes
export const clientsRoutes = Router()

const listQuery = z.object({
  search: z.string().trim().optional(),
  filter: z.enum(['all', 'account', 'guest']).default('all'),
})
const keyParams = z.object({ key: z.string().regex(/^([0-9a-f-]{36}|tel-\d*)$/, 'Client invalide') })

clientsRoutes.use(requireAuth, requireRole('super_admin'))
clientsRoutes.get('/', validate({ query: listQuery }), async (req, res) => res.json(await service.list(req.valid.query)))
clientsRoutes.get('/:key', validate({ params: keyParams }), async (req, res) => res.json(await service.get(req.valid.params.key)))
