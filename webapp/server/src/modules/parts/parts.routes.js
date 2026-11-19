import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import * as controller from './parts.controller.js'
import { listQuery, partParams, statusBody } from './parts.schemas.js'

// Parts de commande : le travail de chaque Maison (employé de la Maison ou super-admin)
export const partsRoutes = Router()

partsRoutes.get('/', requireAuth, requireRole('employe'), validate({ query: listQuery }), controller.listForBrand) // ?brand=patchi&scope=active|today|all
partsRoutes.patch('/:id/status', requireAuth, requireRole('employe'), validate({ params: partParams, body: statusBody }), controller.setStatus) // en_preparation · prete · refusee (motif)
