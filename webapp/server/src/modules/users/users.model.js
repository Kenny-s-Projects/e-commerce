import { query } from '../../config/db.js'

// Comptes et rôles : accès aux données (SQL uniquement).
// Les fonctions qui écrivent reçoivent `db`, le client de la transaction en cours.

const STAFF_ROLES = `('super_admin', 'employe', 'livreur')`

/** Membres de l'équipe (comptes avec un rôle autre que client) */
export async function findStaffUsers() {
  const { rows } = await query(
    `select p.id, p.full_name, p.email, p.phone, p.is_active, p.last_seen_at, p.created_at,
            r.role, b.slug as brand, rd.id as rider_id, rd.vehicle, rd.zone
       from public.profiles p
       join public.user_roles r on r.user_id = p.id and r.role in ${STAFF_ROLES}
       left join public.brands b on b.id = r.brand_id
       left join public.riders rd on rd.profile_id = p.id
      order by p.created_at`,
  )
  return rows
}

/** Invitations en attente (pas encore acceptées ni retirées) */
export async function findPendingInvitations() {
  const { rows } = await query(
    `select i.*, b.slug as brand
       from public.staff_invitations i left join public.brands b on b.id = i.brand_id
      where i.accepted_at is null and i.revoked_at is null
      order by i.created_at`,
  )
  return rows
}

export async function findInvitation(db, id) {
  const { rows } = await db.query(
    `select i.*, b.slug as brand from public.staff_invitations i left join public.brands b on b.id = i.brand_id where i.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function findInvitationByEmail(db, email) {
  const { rows } = await db.query('select * from public.staff_invitations where email = $1', [email])
  return rows[0] ?? null
}

export async function findProfileByEmail(db, email) {
  const { rows } = await db.query('select * from public.profiles where lower(email) = $1', [email])
  return rows[0] ?? null
}

export async function findProfile(db, id) {
  const { rows } = await db.query('select * from public.profiles where id = $1', [id])
  return rows[0] ?? null
}

export async function findStaffRole(db, userId) {
  const { rows } = await db.query(
    `select r.*, b.slug as brand from public.user_roles r left join public.brands b on b.id = r.brand_id
      where r.user_id = $1 and r.role in ${STAFF_ROLES} order by r.created_at limit 1`,
    [userId],
  )
  return rows[0] ?? null
}

export async function findBrandId(db, slug) {
  const { rows } = await db.query('select id from public.brands where slug = $1', [slug])
  return rows[0]?.id ?? null
}

export async function upsertInvitation(db, inv) {
  const { rows } = await db.query(
    `insert into public.staff_invitations (email, first_name, last_name, phone, role, brand_id, vehicle, zone, invited_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (email) do update set
       first_name = excluded.first_name, last_name = excluded.last_name, phone = excluded.phone, role = excluded.role,
       brand_id = excluded.brand_id, vehicle = excluded.vehicle, zone = excluded.zone, invited_by = excluded.invited_by,
       revoked_at = null, accepted_at = null, created_at = now()
     returning id`,
    [inv.email, inv.firstName, inv.lastName, inv.phone ?? null, inv.role, inv.brandId ?? null, inv.vehicle ?? null, inv.zone ?? null, inv.invitedBy ?? null],
  )
  return rows[0].id
}

export async function updateInvitation(db, id, inv) {
  await db.query(
    `update public.staff_invitations set first_name = $2, last_name = $3, phone = $4, role = $5, brand_id = $6, vehicle = $7, zone = $8
      where id = $1`,
    [id, inv.firstName, inv.lastName, inv.phone ?? null, inv.role, inv.brandId ?? null, inv.vehicle ?? null, inv.zone ?? null],
  )
}

export async function revokeInvitation(db, id) {
  await db.query('update public.staff_invitations set revoked_at = now() where id = $1', [id])
}

/** Remplace le rôle d'équipe d'un compte (le rôle client est gardé) */
export async function replaceStaffRole(db, userId, { role, brandId }) {
  await db.query(`delete from public.user_roles where user_id = $1 and role in ${STAFF_ROLES}`, [userId])
  await db.query('insert into public.user_roles (user_id, role, brand_id) values ($1, $2, $3)', [userId, role, brandId ?? null])
}

export async function ensureRider(db, profileId, { vehicle, zone }) {
  await db.query(
    `insert into public.riders (profile_id, vehicle, zone) values ($1, $2, $3)
     on conflict (profile_id) do update set vehicle = coalesce($2, riders.vehicle), zone = coalesce($3, riders.zone)`,
    [profileId, vehicle ?? 'Moto', zone ?? 'Gombe'],
  )
}

export async function updateProfile(db, id, { fullName, phone, lang }) {
  const { rows } = await db.query(
    `update public.profiles set full_name = coalesce($2, full_name), phone = coalesce($3, phone), lang = coalesce($4, lang)
      where id = $1 returning id, full_name, phone, lang, email`,
    [id, fullName ?? null, phone ?? null, lang ?? null],
  )
  return rows[0]
}

export async function setActive(db, id, active) {
  await db.query('update public.profiles set is_active = $2 where id = $1', [id, active])
}

export async function countActiveAdmins(db) {
  const { rows } = await db.query(
    `select count(distinct p.id)::int as n from public.profiles p
       join public.user_roles r on r.user_id = p.id and r.role = 'super_admin'
      where p.is_active`,
  )
  return rows[0].n
}
