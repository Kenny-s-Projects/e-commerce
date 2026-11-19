import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../config/env.js'
import { query } from '../config/db.js'
import { unauthorized } from '../shared/errors.js'

// Le front se connecte avec Supabase Auth (code SMS ou e-mail) puis envoie le jeton :
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

async function loadUser(payload) {
  const { rows } = await query(
    `select p.id, p.full_name, p.phone, p.lang,
            coalesce(json_agg(json_build_object('role', r.role, 'brandId', r.brand_id))
                     filter (where r.id is not null), '[]') as roles
       from public.profiles p
       left join public.user_roles r on r.user_id = p.id
      where p.id = $1
      group by p.id`,
    [payload.sub],
  )
  if (!rows[0]) throw unauthorized('Profil introuvable')
  const user = rows[0]
  return {
    ...user,
    email: payload.email ?? null,
    has: (role) => user.roles.some((r) => r.role === role),
    brandIds: user.roles.filter((r) => r.role === 'employe').map((r) => r.brandId),
  }
}

/** Connexion obligatoire : req.user = { id, full_name, roles, has(role), brandIds } */
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next(unauthorized())
  try {
    req.user = await loadUser(await verify(token))
    next()
  } catch (err) {
    next(err.status ? err : unauthorized('Session invalide ou expirée'))
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
