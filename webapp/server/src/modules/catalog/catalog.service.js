import * as model from './catalog.model.js'
import { notFound } from '../../shared/errors.js'

// Règles métier du catalogue : mise en forme commune des produits pour le site.

/**
 * Mise en forme d'un produit pour le site :
 *  - Maison fermée (Paramètres › Maisons) : visible mais « bientôt disponible », pas d'achat
 *  - vente au kilo : le stock est en kg sur le produit ; une variante (250 g…) est disponible si le stock la couvre
 *  - vente à la pièce : stock par variante
 */
export function present(p) {
  const kg = p.unit === 'kg'
  const stockKg = p.stock_kg == null ? null : Number(p.stock_kg)
  const open = p.brand_open !== false
  const variants = p.variants.map((v) => {
    const inStock = kg ? v.weight_grams != null && v.weight_grams <= (stockKg ?? 0) * 1000 : v.stock > 0
    return { ...v, in_stock: inStock, available: open && v.price != null && inStock }
  })
  const prices = variants.map((v) => v.price).filter((x) => x != null)
  const { brand_id: _b, category_id: _c, total: _t, brand_open: _o, ...rest } = p
  return {
    ...rest,
    stock_kg: stockKg,
    variants,
    is_open: open,
    coming_soon: !open,
    price_from: prices.length ? Math.min(...prices) : null,
    stock: kg ? stockKg ?? 0 : variants.reduce((acc, v) => acc + v.stock, 0),
    available: variants.some((v) => v.available),
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
