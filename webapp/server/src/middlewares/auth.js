import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../config/env.js'
import { query } from '../config/db.js'
import { logger } from '../config/logger.js'
import { AppError, unauthorized } from '../shared/errors.js'

// Le front se connecte avec Supabase Auth (code à 6 chiffres reçu par e-mail) puis envoie le jeton :
//   Authorization: Bearer <access_token>
const jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
const secret = env.SUPABASE_JWT_SECRET ? new TextEncoder().encode(env.SUPABASE_JWT_SECRET) : null

async function verify(token) {
  const options = { issuer: `${env.SUPABASE_URL}/auth/v1`, audience: 'authenticated' }
  try {
    return (await jwtVerify(token, jwks, options)).payload
  } catch (err) {
    if (secret) return (await jwtVerify(token, secret, options)).payload // anciens jetons HS256
    throw err
  }
}

export const accountDisabled = () =>
  new AppError(403, 'ACCOUNT_DISABLED', 'Ce compte a été désactivé. Contactez l’administrateur.')

/**
 * Profil + rôles d'un compte. Utilisé par le middleware et par les tests.
 * Renvoie { id, full_name, phone, lang, email, is_active, roles, has(role), brandIds }
 */
export async function loadUser(id, tokenEmail = null) {
  const { rows } = await query(
    `select p.id, p.full_name, p.phone, p.lang, p.email, p.is_active, p.last_seen_at,
            coalesce(json_agg(json_build_object('role', r.role, 'brandId', r.brand_id))
                     filter (where r.id is not null), '[]') as roles
       from public.profiles p
       left join public.user_roles r on r.user_id = p.id
      where p.id = $1
      group by p.id`,
    [id],
  )
  if (!rows[0]) throw unauthorized('Profil introuvable')
  const user = rows[0]
  return {
    ...user,
    email: user.email ?? tokenEmail,
    has: (role) => user.roles.some((r) => r.role === role),
    brandIds: user.roles.filter((r) => r.role === 'employe').map((r) => r.brandId),
  }
}

// Dernière connexion : au plus une écriture toutes les 5 minutes par compte, sans jamais bloquer la requête
const SEEN_EVERY_MS = 5 * 60 * 1000
const lastWrite = new Map()
export function touchLastSeen(user) {
  const now = Date.now()
  const previous = Math.max(lastWrite.get(user.id) ?? 0, user.last_seen_at ? new Date(user.last_seen_at).getTime() : 0)
  if (now - previous < SEEN_EVERY_MS) return
  lastWrite.set(user.id, now)
  query('update public.profiles set last_seen_at = now() where id = $1', [user.id]).catch((err) =>
    logger.warn({ err, userId: user.id }, 'last_seen_at non mis à jour'),
  )
}

/** Connexion obligatoire : req.user = { id, full_name, email, roles, has(role), brandIds } */
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next(unauthorized())
  let payload
  try {
    payload = await verify(token)
  } catch {
    return next(unauthorized('Session invalide ou expirée'))
  }
  try {
    const user = await loadUser(payload.sub, payload.email ?? null)
    if (!user.is_active) return next(accountDisabled())
    touchLastSeen(user)
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

/** Connexion facultative : req.user si un jeton valide est fourni, sinon null (commande sans compte). */
export async function optionalAuth(req, res, next) {
  if (!req.get('authorization')) {
    req.user = null
    return next()
  }
  return requireAuth(req, res, next)
}
