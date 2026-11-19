import { query } from '../../../config/db.js'

// Notification dans l'application : une ligne dans public.notifications
export async function send({ profileId = null, brandId = null, phone = null, orderId = null, title, body }) {
  await query(
    `insert into public.notifications (profile_id, brand_id, recipient_phone, order_id, channel, title, body)
     values ($1, $2, $3, $4, 'app', $5, $6)`,
    [profileId, brandId, phone, orderId, title, body],
  )
}
