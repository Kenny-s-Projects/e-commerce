import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import * as service from './settings.service.js'
import { sectionParams } from './settings.schemas.js'

// Paramètres : général, livraison, paiements, notifications, sécurité
export const settingsRoutes = Router()

const admin = [requireAuth, requireRole('super_admin')]

settingsRoutes.get('/public', async (req, res) => res.json(await service.publicSettings())) // checkout (public)
settingsRoutes.get('/', ...admin, async (req, res) => res.json(await service.getAll()))
settingsRoutes.put('/:section', ...admin, validate({ params: sectionParams }), async (req, res) =>
  res.json(await service.update(req.user, req.valid.params.section, req.body)),
)
