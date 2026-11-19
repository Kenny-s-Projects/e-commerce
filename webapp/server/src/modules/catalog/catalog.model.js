import { query } from '../../config/db.js'

// Accès aux données du catalogue : uniquement du SQL, aucune règle métier.

export async function findCategories(brandSlug) {
  const { rows } = await query(
    `select c.id, c.slug, c.name_fr, c.name_en, c.parent_id, b.slug as brand
       from public.categories c join public.brands b on b.id = c.brand_id
      where ($1::text is null or b.slug = $1)
      order by b.slug, c.position`,
    [brandSlug ?? null],
  )
  return rows
}

export async function findProducts({ brand, category, search, limit, offset }) {
  const { rows } = await query(
    `select p.id, p.slug, p.name_fr, p.name_en, p.description_fr, p.description_en, p.base_price, p.tag,
            b.slug as brand, c.slug as category,
            (select url from public.product_images i where i.product_id = p.id order by i.position limit 1) as image,
            (select coalesce(sum(v.stock), 0) from public.product_variants v where v.product_id = p.id and v.is_active) as stock,
            count(*) over () as total
       from public.products p
       join public.brands b on b.id = p.brand_id
       left join public.categories c on c.id = p.category_id
      where p.is_active
        and ($1::text is null or b.slug = $1)
        and ($2::text is null or c.slug = $2)
        and ($3::text is null or p.name_fr ilike '%' || $3 || '%' or p.name_en ilike '%' || $3 || '%')
      order by b.slug, c.position nulls last, p.name_fr
      limit $4 offset $5`,
    [brand ?? null, category ?? null, search ?? null, limit, offset],
  )
  return rows
}

export async function findProductBySlug(slug) {
  const { rows } = await query(
    `select p.*, b.slug as brand, b.name as brand_name, c.slug as category,
            coalesce((select json_agg(v order by v.position) from (
              select id, label, price, unit, stock, is_default, position
                from public.product_variants where product_id = p.id and is_active) v), '[]') as variants,
            coalesce((select json_agg(i order by i.position) from (
              select url, alt, variant_id, position from public.product_images where product_id = p.id) i), '[]') as images
       from public.products p
       join public.brands b on b.id = p.brand_id
       left join public.categories c on c.id = p.category_id
      where p.slug = $1 and p.is_active`,
    [slug],
  )
  return rows[0] ?? null
}
