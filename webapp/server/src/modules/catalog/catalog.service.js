import * as model from './catalog.model.js'
import { notFound } from '../../shared/errors.js'

// Règles métier du catalogue : mise en forme commune des produits pour le site.

// Prix affiché « à partir de », stock total, commandable ou non
function present(p) {
  const prices = p.variants.map((v) => v.price).filter((x) => x != null)
  const stock = p.variants.reduce((acc, v) => acc + v.stock, 0)
  const { brand_id: _b, category_id: _c, total: _t, ...rest } = p
  return {
    ...rest,
    price_from: prices.length ? Math.min(...prices) : null,
    stock,
    available: prices.length > 0 && stock > 0,
    image: p.images[0]?.url ?? null,
  }
}

export const listBrands = (brand) => model.findBrands(brand)

export async function listProducts(filters) {
  const rows = await model.findProducts(filters)
  return { total: Number(rows[0]?.total ?? 0), limit: filters.limit, offset: filters.offset, items: rows.map(present) }
}

export async function getProduct(slug) {
  const product = await model.findProductBySlug(slug)
  if (!product) throw notFound('Produit')
  const related = await model.findRelated(product)
  return { ...present(product), related: related.map(present) }
}
