import { query, transaction } from '../../config/db.js'
import { logger } from '../../config/logger.js'
import { badRequest, conflict, forbidden, notFound } from '../../shared/errors.js'
import * as model from './users.model.js'
import { events } from '../../shared/events.js'
import { hasEmailProvider } from '../notifications/channels/email.js'

// Comptes de l'équipe : invitation, rôle, activation. Réservé au super admin (sauf « moi »).
// Une invitation donne son rôle à la première connexion par code e-mail (trigger handle_new_user).

const splitName = (full) => {
  const [first = '', ...rest] = (full ?? '').trim().split(/\s+/)
  return { firstName: first, lastName: rest.join(' ') }
}

const presentUser = (u) => ({
  id: u.id,
  kind: 'user',
  ...splitName(u.full_name),
  email: u.email,
  phone: u.phone,
  role: u.role,
  brand: u.brand ?? null,
  riderId: u.rider_id ?? null,
  vehicle: u.vehicle ?? null,
  zone: u.zone ?? null,
  status: u.is_active ? 'actif' : 'desactive',
  lastSeenAt: u.last_seen_at,
  createdAt: u.created_at,
})

const presentInvitation = (i) => ({
  id: i.id,
  kind: 'invitation',
  firstName: i.first_name ?? '',
  lastName: i.last_name ?? '',
  email: i.email,
  phone: i.phone,
  role: i.role,
  brand: i.brand ?? null,
  riderId: null,
  vehicle: i.vehicle ?? null,
  zone: i.zone ?? null,
  status: 'invite',
  lastSeenAt: null,
  createdAt: i.created_at,
})

async function allStaff() {
  const [users, invitations] = await Promise.all([model.findStaffUsers(), model.findPendingInvitations()])
  return [...users.map(presentUser), ...invitations.map(presentInvitation)]
}

export async function list({ role, status, search } = {}) {
  const q = search?.toLowerCase()
  return (await allStaff()).filter(
    (u) =>
      (!role || u.role === role) &&
      (!status || u.status === status) &&
      (!q || `${u.firstName} ${u.lastName} ${u.email} ${u.phone ?? ''} ${u.brand ?? ''}`.toLowerCase().includes(q)),
  )
}

export async function get(id) {
  const found = (await allStaff()).find((u) => u.id === id)
  if (!found) throw notFound('Utilisateur')
  return found
}

async function brandIdOf(db, data) {
  if (data.role !== 'employe') return null
  const id = await model.findBrandId(db, data.brand)
  if (!id) throw badRequest('UNKNOWN_BRAND', `Maison inconnue : ${data.brand}`)
  return id
}

/**
 * Inviter une personne. Si elle a déjà un compte (client par exemple), le rôle est donné tout de suite ;
 * sinon une invitation attend sa première connexion.
 */
export async function invite(admin, data) {
  const result = await transaction(async (db) => {
    const brandId = await brandIdOf(db, data)
    const profile = await model.findProfileByEmail(db, data.email)

    if (profile) {
      const current = await model.findStaffRole(db, profile.id)
      if (current) throw conflict('ALREADY_STAFF', 'Cette personne fait déjà partie de l’équipe')
      await model.replaceStaffRole(db, profile.id, { role: data.role, brandId })
      if (data.role === 'livreur') await model.ensureRider(db, profile.id, data)
      await model.updateProfile(db, profile.id, {
        fullName: profile.full_name || `${data.firstName} ${data.lastName}`,
        phone: profile.phone ? undefined : data.phone,
      })
      return { id: profile.id, kind: 'user' }
    }

    const existing = await model.findInvitationByEmail(db, data.email)
    if (existing && !existing.revoked_at && !existing.accepted_at) throw conflict('ALREADY_INVITED', 'Une invitation est déjà en attente pour cet e-mail')
    const id = await model.upsertInvitation(db, { ...data, brandId, invitedBy: admin.id })
    return { id, kind: 'invitation' }
  })
  events.emit('user.invited', { email: data.email, firstName: data.firstName, role: data.role, brandName: await brandName(data.brand) })
  return get(result.id)
}

/** Modifier un membre (ou une invitation en attente) : nom, téléphone, rôle, Maison, véhicule, zone */
export async function update(admin, id, changes) {
  await transaction(async (db) => {
    const invitation = await model.findInvitation(db, id)
    if (invitation && !invitation.accepted_at && !invitation.revoked_at) {
      const next = {
        firstName: changes.firstName ?? invitation.first_name,
        lastName: changes.lastName ?? invitation.last_name,
        phone: changes.phone ?? invitation.phone,
        role: changes.role ?? invitation.role,
        brand: changes.brand ?? invitation.brand,
        vehicle: changes.vehicle ?? invitation.vehicle,
        zone: changes.zone ?? invitation.zone,
      }
      if (next.role === 'employe' && !next.brand) throw badRequest('BRAND_REQUIRED', 'Maison obligatoire pour un employé')
      await model.updateInvitation(db, id, { ...next, brandId: await brandIdOf(db, next) })
      return
    }

    const profile = await model.findProfile(db, id)
    const current = profile && (await model.findStaffRole(db, id))
    if (!current) throw notFound('Utilisateur')

    const role = changes.role ?? current.role
    const brand = changes.brand ?? (role === 'employe' ? current.brand : undefined)
    if (role === 'employe' && !brand) throw badRequest('BRAND_REQUIRED', 'Maison obligatoire pour un employé')
    if (current.role === 'super_admin' && role !== 'super_admin') {
      if (id === admin.id) throw forbidden('Vous ne pouvez pas retirer votre propre rôle de super admin')
      if ((await model.countActiveAdmins(db)) <= 1) throw forbidden('Il doit rester au moins un super admin actif')
    }
    if (role !== current.role || brand !== current.brand) {
      await model.replaceStaffRole(db, id, { role, brandId: await brandIdOf(db, { role, brand }) })
    }
    if (role === 'livreur') await model.ensureRider(db, id, changes)

    const names = splitName(profile.full_name)
    const fullName =
      changes.firstName || changes.lastName ? `${changes.firstName ?? names.firstName} ${changes.lastName ?? names.lastName}`.trim() : undefined
    await model.updateProfile(db, id, { fullName, phone: changes.phone })
  })
  return get(id)
}

/** Désactiver / réactiver un compte (jamais soi-même, jamais le dernier super admin actif) */
export async function setActive(admin, id, active) {
  await transaction(async (db) => {
    const profile = await model.findProfile(db, id)
    const role = profile && (await model.findStaffRole(db, id))
    if (!role) throw notFound('Utilisateur')
    if (!active) {
      if (id === admin.id) throw forbidden('Vous ne pouvez pas désactiver votre propre compte')
      if (role.role === 'super_admin' && profile.is_active && (await model.countActiveAdmins(db)) <= 1)
        throw forbidden('Il doit rester au moins un super admin actif')
    }
    await model.setActive(db, id, active)
  })
  return get(id)
}

export async function revokeInvitation(id) {
  await transaction(async (db) => {
    const inv = await model.findInvitation(db, id)
    if (!inv || inv.accepted_at || inv.revoked_at) throw notFound('Invitation')
    await model.revokeInvitation(db, id)
  })
  return { id, revoked: true }
}

/** Renvoyer l'e-mail d'invitation (file d'envoi Resend) */
export async function resendInvitation(id) {
  const inv = await model.findInvitation({ query }, id)
  if (!inv || inv.accepted_at || inv.revoked_at) throw notFound('Invitation')
  events.emit('user.invited', { email: inv.email, firstName: inv.first_name, role: inv.role, brandName: await brandName(inv.brand) })
  if (!hasEmailProvider()) {
    logger.info('Renvoi d’invitation enregistré, mais RESEND_API_KEY manquante : aucun e-mail envoyé')
    return { id, sent: false, reason: 'Service d’e-mails non configuré (RESEND_API_KEY)' }
  }
  return { id, sent: true }
}

async function brandName(slug) {
  if (!slug) return null
  const { rows } = await query('select name from public.brands where slug = $1', [slug])
  return rows[0]?.name ?? null
}

/* ---------- Mon compte (tout utilisateur connecté) ---------- */

export const me = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  phone: user.phone,
  lang: user.lang,
  roles: user.roles,
  brandIds: user.brandIds,
})

export async function updateMe(user, changes) {
  return model.updateProfile({ query }, user.id, changes)
}
