import { query } from '../../config/db.js'

// Clients : accès aux données (SQL uniquement)

/** Toutes les commandes, résumées (client, total, Maisons) */
export async function findOrderSummaries() {
  const { rows } = await query(
    `select o.id, o.number, o.customer_id, o.customer_name, o.customer_email, o.customer_phone, o.status,
            o.mode, o.adjusted_total, o.total, o.created_at,
            coalesce((select array_agg(b.slug order by b.slug) from public.order_parts p
                        join public.brands b on b.id = p.brand_id where p.order_id = o.id), '{}') as brands
       from public.orders o
      order by o.created_at desc`,
  )
  return rows
}

/** Comptes clients (rôle client uniquement, pas l'équipe) */
export async function findClientProfiles() {
  const { rows } = await query(
    `select p.id, p.full_name, p.email, p.phone, p.lang, p.created_at
       from public.profiles p
      where not exists (select 1 from public.user_roles r where r.user_id = p.id and r.role <> 'client')`,
  )
  return rows
}

export async function findAddresses(profileId) {
  const { rows } = await query(
    `select id, label, commune, quartier, street, landmark, is_default, created_at
       from public.addresses where profile_id = $1 order by is_default desc, created_at`,
    [profileId],
  )
  return rows
}
