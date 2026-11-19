import { query } from '../../config/db.js'

// Livraisons : accès aux données (SQL uniquement).

/** Livreurs avec leur course en cours (commande assignée, ni livrée ni annulée) */
export async function findRiders() {
  const { rows } = await query(
    `select r.id, r.profile_id, pr.full_name as name, pr.phone, r.vehicle, r.zone, r.is_available, pr.is_active,
            (select row_to_json(c) from (
               select o.id as order_id, o.number, o.status, d.eta_minutes, d.assigned_at, d.picked_up_at,
                      o.customer_name
                 from public.deliveries d join public.orders o on o.id = d.order_id
                where d.rider_id = r.id and d.delivered_at is null and o.status not in ('annulee', 'refusee', 'livree')
                order by d.assigned_at desc limit 1) c) as current
       from public.riders r join public.profiles pr on pr.id = r.profile_id
      order by pr.full_name`,
  )
  return rows
}

export async function findRider(db, riderId) {
  const { rows } = await db.query(
    `select r.*, pr.full_name as name, pr.is_active from public.riders r join public.profiles pr on pr.id = r.profile_id where r.id = $1`,
    [riderId],
  )
  return rows[0] ?? null
}

export async function findRiderByProfile(profileId) {
  const { rows } = await query('select * from public.riders where profile_id = $1', [profileId])
  return rows[0] ?? null
}

export async function upsertDelivery(db, { orderId, riderId, assignedBy, eta }) {
  await db.query(
    `insert into public.deliveries (order_id, rider_id, assigned_by, eta_minutes)
     values ($1, $2, $3, $4)
     on conflict (order_id) do update set rider_id = excluded.rider_id, assigned_by = excluded.assigned_by,
                                         eta_minutes = excluded.eta_minutes, assigned_at = now()`,
    [orderId, riderId, assignedBy, eta ?? null],
  )
}

export async function lockDelivery(db, orderId) {
  const { rows } = await db.query(
    `select d.*, r.profile_id as rider_profile_id from public.deliveries d join public.riders r on r.id = d.rider_id
      where d.order_id = $1 for update of d`,
    [orderId],
  )
  return rows[0] ?? null
}

export async function markPickedUp(db, orderId) {
  await db.query('update public.deliveries set picked_up_at = coalesce(picked_up_at, now()) where order_id = $1', [orderId])
}

export async function markDelivered(db, orderId) {
  await db.query('update public.deliveries set delivered_at = now() where order_id = $1', [orderId])
}

export async function setAvailability(profileId, available) {
  const { rows } = await query('update public.riders set is_available = $2 where profile_id = $1 returning *', [profileId, available])
  return rows[0] ?? null
}
