import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import * as controller from './parts.controller.js'

// Parts de commande : le travail de chaque brand
export const partsRoutes = Router()

partsRoutes.get('/', requireAuth, requireRole('employe'), controller.listForBrand) // Parts de sa brand, par onglet (?tab=en_attente…)
partsRoutes.patch('/:id/status', requireAuth, requireRole('employe', 'livreur'), controller.setStatus) // Accepter, préparer, prête, refuser (motif obligatoire), collectée
