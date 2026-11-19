import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as service from './auth.service.js'

// Connexion (le code à 6 chiffres est envoyé et vérifié par Supabase Auth, côté front)
export const authRoutes = Router()

const checkLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })
const checkBody = z.object({ email: z.email('E-mail invalide').transform((e) => e.trim().toLowerCase()) })

authRoutes.post('/staff/check', checkLimiter, validate({ body: checkBody }), async (req, res) =>
  res.json(await service.checkStaff(req.valid.body.email)),
) // l'e-mail peut-il entrer dans l'espace équipe ?
authRoutes.get('/me', requireAuth, async (req, res) => res.json(await service.me(req.user))) // profil, rôles, page d'arrivée
