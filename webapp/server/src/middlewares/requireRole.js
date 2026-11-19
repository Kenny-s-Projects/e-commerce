import { forbidden, unauthorized } from '../shared/errors.js'

/**
 * Autorise un ou plusieurs rôles. Le super-admin passe toujours.
 *   router.patch('/:id/status', requireAuth, requireRole('employe'), …)
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(unauthorized())
  if (req.user.has('super_admin') || roles.some((r) => req.user.has(r))) return next()
  next(forbidden())
}
