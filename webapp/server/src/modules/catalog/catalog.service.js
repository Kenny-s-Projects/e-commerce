import * as model from './catalog.model.js'
import { notFound } from '../../shared/errors.js'

// Règles métier du catalogue (ici simples : mise en forme et produit introuvable)

export const listCategories = (brand) => model.findCategories(brand)

export async function listProducts(filters) {
  const rows = await model.findProducts(filters)
  const total = rows[0]?.total ?? 0
  return { total: Number(total), items: rows.map(({ total: _t, ...p }) => p) }
}

export async function getProduct(slug) {
  const product = await model.findProductBySlug(slug)
  if (!product) throw notFound('Produit')
  return product
}
