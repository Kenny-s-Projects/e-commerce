import { query } from '../../config/db.js'

// Accès aux données du catalogue : uniquement du SQL, aucune règle métier.

// Variantes et photos d'un produit, sous forme de listes JSON (réutilisé par les requêtes ci-dessous)
const VARIANTS = `coalesce((select json_agg(v order by v.position) from (
    select id, label, price, unit, stock, weight_grams, is_default, position
      from public.product_variants where product_id = p.id and is_active) v), '[]')`
const IMAGES = `coalesce((select json_agg(i order by i.position) from (
    select url, alt, variant_id, position from public.product_images where product_id = p.id) i), '[]')`
const PRODUCT_COLUMNS = `p.id, p.slug, p.ref, p.unit, p.stock_kg, p.name_fr, p.name_en, p.description_fr, p.description_en, p.base_price, p.tag,
       b.slug as brand, b.name as brand_name, b.is_open as brand_open, c.slug as category, c.name_fr as category_fr, c.name_en as category_en,
       ${VARIANTS} as variants, ${IMAGES} as images`

const SORTS = {
  default: 'c.position nulls last, p.name_fr',
  price_asc: 'p.base_price asc nulls last, p.name_fr',
  price_desc: 'p.base_price desc nulls last, p.name_fr',
  name: 'p.name_fr',
}

export async function findBrands(brandSlug) {
  const { rows } = await query(
    `select b.id, b.slug, b.name, b.color, b.logo_url, b.is_open, b.is_pickup_point, b.pickup_address,
            coalesce((select json_agg(c order by c.position) from (
              select c.slug, c.name_fr, c.name_en, c.parent_id, c.position,
                     (select count(*)::int from public.products p where p.category_id = c.id and p.is_active) as products
                from public.categories c where c.brand_id = b.id) c), '[]') as categories
       from public.brands b
      where ($1::text is null or b.slug = $1)
      order by b.created_at`,
    [brandSlug ?? null],
  )
  return rows
}

export async function findProducts({ brand, category, tag, search, inStock, sort, limit, offset }) {
  const { rows } = await query(
    `select ${PRODUCT_COLUMNS}, count(*) over () as total
       from public.products p
       join public.brands b on b.id = p.brand_id
       left join public.categories c on c.id = p.category_id
      where p.is_active
        and ($1::text is null or b.slug = $1)
        and ($2::text is null or c.slug = $2)
        and ($3::text is null or p.tag = $3)
        and ($4::text is null or p.name_fr ilike '%' || $4 || '%' or p.name_en ilike '%' || $4 || '%'
             or b.name ilike '%' || $4 || '%' or c.name_fr ilike '%' || $4 || '%')
        and ($5::boolean is not true or (b.is_open and exists (
              select 1 from public.product_variants v where v.product_id = p.id and v.is_active and v.price is not null
                 and (case when p.unit = 'kg' then v.weight_grams <= coalesce(p.stock_kg, 0) * 1000 else v.stock > 0 end))))
      order by b.created_at, ${SORTS[sort] ?? SORTS.default}
      limit $6 offset $7`,
    [brand ?? null, category ?? null, tag ?? null, search ?? null, inStock ?? null, limit, offset],
  )
  return rows
}

export async function findProductBySlug(slug) {
  const { rows } = await query(
    `select ${PRODUCT_COLUMNS}, p.brand_id, p.category_id
       from public.products p
       join public.brands b on b.id = p.brand_id
       left join public.categories c on c.id = p.category_id
      where p.slug = $1 and p.is_active`,
    [slug],
  )
  return rows[0] ?? null
}

// Produits liés : même rayon d'abord, puis même brand
export async function findRelated(product, limit = 4) {
  const { rows } = await query(
    `select ${PRODUCT_COLUMNS}
       from public.products p
       join public.brands b on b.id = p.brand_id
       left join public.categories c on c.id = p.category_id
      where p.is_active and p.brand_id = $1 and p.id <> $2
      order by (p.category_id is not distinct from $3) desc, p.name_fr
      limit $4`,
    [product.brand_id, product.id, product.category_id, limit],
  )
  return rows
}
