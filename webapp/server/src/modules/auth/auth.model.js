import { query } from '../../config/db.js'

// Connexion : accès aux données (SQL uniquement)

/** Compte d'équipe existant pour cet e-mail : { is_active, role } ou null */
export async function findStaffByEmail(email) {
  const { rows } = await query(
    `select p.id, p.is_active, r.role
       from public.profiles p
       join public.user_roles r on r.user_id = p.id and r.role in ('super_admin', 'employe', 'livreur')
      where lower(p.email) = $1
      order by case r.role when 'super_admin' then 0 when 'employe' then 1 else 2 end
      limit 1`,
    [email],
  )
  return rows[0] ?? null
}

/** Invitation en attente pour cet e-mail */
export async function findPendingInvitation(email) {
  const { rows } = await query(
    `select role from public.staff_invitations where email = $1 and accepted_at is null and revoked_at is null`,
    [email],
  )
  return rows[0] ?? null
}

export async function brandSlugs(ids) {
  if (!ids.length) return []
  const { rows } = await query('select id, slug from public.brands where id = any($1::uuid[])', [ids])
  return rows
}

/** Un compte (Supabase Auth) existe-t-il déjà avec cet e-mail ? */
export async function accountExists(email) {
  const { rows } = await query('select 1 from auth.users where lower(email) = $1 limit 1', [email])
  return rows.length > 0
}
