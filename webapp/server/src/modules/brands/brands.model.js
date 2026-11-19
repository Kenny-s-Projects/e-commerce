import { query } from '../../config/db.js'

// Maisons : accès aux données (SQL uniquement)

const HOURS = `coalesce((select json_agg(h order by h.weekday) from (
    select weekday, to_char(opens_at, 'HH24:MI') as opens_at, to_char(closes_at, 'HH24:MI') as closes_at,
           to_char(last_order_at, 'HH24:MI') as last_order_at
      from public.brand_hours where brand_id = b.id) h), '[]')`

export async function findAll() {
  const { rows } = await query(
    `select b.id, b.slug, b.name, b.color, b.logo_url, b.is_open, b.is_pickup_point, b.pickup_address, ${HOURS} as hours
       from public.brands b order by b.created_at`,
  )
  return rows
}

export async function findBySlug(slug) {
  const { rows } = await query(
    `select b.id, b.slug, b.name, b.color, b.logo_url, b.is_open, b.is_pickup_point, b.pickup_address, ${HOURS} as hours
       from public.brands b where b.slug = $1`,
    [slug],
  )
  return rows[0] ?? null
}

export async function update(db, id, { isOpen, isPickupPoint, pickupAddress }) {
  await db.query(
    `update public.brands set is_open = coalesce($2, is_open), is_pickup_point = coalesce($3, is_pickup_point),
                              pickup_address = coalesce($4, pickup_address)
      where id = $1`,
    [id, isOpen ?? null, isPickupPoint ?? null, pickupAddress ?? null],
  )
}

/** Un seul point de retrait à la fois */
export async function clearOtherPickupPoints(db, id) {
  await db.query('update public.brands set is_pickup_point = false where id <> $1', [id])
}

export async function replaceHours(db, brandId, hours) {
  await db.query('delete from public.brand_hours where brand_id = $1', [brandId])
  for (const h of hours)
    await db.query(
      `insert into public.brand_hours (brand_id, weekday, opens_at, closes_at, last_order_at) values ($1, $2, $3, $4, $5)`,
      [brandId, h.weekday, h.opensAt ?? null, h.closesAt ?? null, h.lastOrderAt ?? null],
    )
}
