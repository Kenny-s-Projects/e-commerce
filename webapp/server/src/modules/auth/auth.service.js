import { AppError } from '../../shared/errors.js'
import { accountDisabled } from '../../middlewares/auth.js'
import * as model from './auth.model.js'

// Connexion par code e-mail (Supabase Auth). L'API vérifie seulement qui a le droit d'entrer dans l'espace équipe,
// et indique au front où envoyer la personne après la connexion.

const notStaff = () =>
  new AppError(404, 'NOT_STAFF', 'Aucun compte d’équipe avec cette adresse. Demandez une invitation à l’administrateur.')

/** Avant d'envoyer un code depuis la page de connexion de l'équipe */
export async function checkStaff(email) {
  const staff = await model.findStaffByEmail(email)
  if (staff) {
    if (!staff.is_active) throw accountDisabled()
    return { allowed: true, role: staff.role, invited: false }
  }
  const invitation = await model.findPendingInvitation(email)
  if (invitation) return { allowed: true, role: invitation.role, invited: true }
  throw notStaff()
}

/** Page d'arrivée selon le rôle : super admin, employé (sa Maison), livreur, sinon espace client */
export async function home(user) {
  if (user.has('super_admin')) return '#admin'
  if (user.brandIds.length) {
    const [brand] = await model.brandSlugs(user.brandIds)
    if (brand) return `#employe/${brand.slug}`
  }
  if (user.has('livreur')) return '#livreur'
  return '#compte/profil'
}

export async function me(user) {
  const brands = await model.brandSlugs(user.brandIds)
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    lang: user.lang,
    roles: user.roles.map((r) => ({ role: r.role, brand: brands.find((b) => b.id === r.brandId)?.slug ?? null })),
    brands: brands.map((b) => b.slug),
    home: await home(user),
  }
}

/** Inscription : l'adresse a-t-elle déjà un compte ? (le front propose alors de se connecter) */
export async function checkEmail(email) {
  return { exists: await model.accountExists(email) }
}
