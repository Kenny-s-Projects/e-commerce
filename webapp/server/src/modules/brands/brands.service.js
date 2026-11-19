import { transaction } from '../../config/db.js'
import { events } from '../../shared/events.js'
import { forbidden, notFound } from '../../shared/errors.js'
import * as model from './brands.model.js'

// Maisons : une Maison fermée garde sa page, ses produits passent en « Bientôt disponible » (sans achat).

const present = ({ id: _id, ...b }) => b

export async function list() {
  return (await model.findAll()).map(present)
}

async function brandOr404(slug) {
  const brand = await model.findBySlug(slug)
  if (!brand) throw notFound('Maison')
  return brand
}

export async function get(slug) {
  return present(await brandOr404(slug))
}

export async function update(slug, changes) {
  const brand = await brandOr404(slug)
  await transaction(async (db) => {
    if (changes.isPickupPoint) await model.clearOtherPickupPoints(db, brand.id)
    await model.update(db, brand.id, changes)
  })
  if (changes.isOpen !== undefined && changes.isOpen !== brand.is_open) events.emit('brand.toggled', { brand: slug, isOpen: changes.isOpen })
  return get(slug)
}

export async function hours(slug) {
  return (await brandOr404(slug)).hours
}

/** Super admin, ou employé de cette Maison */
export async function updateHours(user, slug, list) {
  const brand = await brandOr404(slug)
  if (!user.has('super_admin') && !user.brandIds.includes(brand.id)) throw forbidden('Seule l’équipe de cette Maison peut modifier ses horaires')
  await transaction((db) => model.replaceHours(db, brand.id, list))
  return hours(slug)
}
