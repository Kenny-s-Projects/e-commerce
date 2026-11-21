import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as service from './auth.service.js'

// Connexion (le code à 6 chiffres est envoyé et vérifié par Supabase Auth, côté front)
export const authRoutes = Router()

const checkLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })
const checkBody = z.object({ email: z.string().trim().toLowerCase().pipe(z.email('E-mail invalide')) })

authRoutes.post('/staff/check', checkLimiter, validate({ body: checkBody }), async (req, res) =>
  res.json(await service.checkStaff(req.valid.body.email)),
) // l'e-mail peut-il entrer dans l'espace équipe ?
// Inscription : 3 vérifications par adresse IP, puis attente de 30 minutes
const emailLimiter = rateLimit({
  windowMs: 30 * 60_000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      error: { code: 'TOO_MANY_ATTEMPTS', message: 'Trop de tentatives. Réessayez dans 30 minutes.', requestId: req.id },
    }),
})

authRoutes.post('/email/check', emailLimiter, validate({ body: checkBody }), async (req, res) =>
  res.json(await service.checkEmail(req.valid.body.email)),
) // inscription : un compte existe-t-il déjà avec cet e-mail ?
authRoutes.get('/me', requireAuth, async (req, res) => res.json(await service.me(req.user))) // profil, rôles, page d'arrivée
