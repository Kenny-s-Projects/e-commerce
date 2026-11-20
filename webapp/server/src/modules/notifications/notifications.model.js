import { query } from '../../config/db.js'

// File d'envoi des e-mails (table email_outbox) et données utiles aux e-mails : SQL uniquement.

export async function insertEmail({ kind, to, subject, html, text, orderId }) {
  const { rows } = await query(
    `insert into public.email_outbox (kind, to_email, subject, html, text, order_id)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [kind, to, subject, html, text ?? null, orderId ?? null],
  )
  return rows[0].id
}

/** E-mails à envoyer maintenant (les plus anciens d'abord) */
export async function findDueEmails(limit = 20) {
  const { rows } = await query(
    `select * from public.email_outbox
      where status = 'en_attente' and next_attempt_at <= now()
      order by created_at limit $1`,
    [limit],
  )
  return rows
}

export async function markSent(id, providerId) {
  await query(
    `update public.email_outbox set status = 'envoye', provider_id = $2, sent_at = now(), attempts = attempts + 1, last_error = null
      where id = $1`,
    [id, providerId],
  )
}

export async function markIgnored(id, reason) {
  await query(`update public.email_outbox set status = 'ignore', last_error = $2 where id = $1`, [id, reason])
}

/** Échec : nouvel essai plus tard (retryInSeconds) ou abandon (retryInSeconds = null) */
export async function markFailed(id, error, retryInSeconds) {
  await query(
    `update public.email_outbox
        set attempts = attempts + 1, last_error = $2,
            status = case when $3::int is null then 'echec' else 'en_attente' end,
            next_attempt_at = case when $3::int is null then next_attempt_at else now() + make_interval(secs => $3::int) end
      where id = $1`,
    [id, String(error).slice(0, 500), retryInSeconds],
  )
}

export async function findEmails({ status, limit }) {
  const { rows } = await query(
    `select e.id, e.kind, e.to_email, e.subject, e.status, e.attempts, e.last_error, e.provider_id,
            e.created_at, e.sent_at, e.next_attempt_at, o.number as order_number
       from public.email_outbox e left join public.orders o on o.id = e.order_id
      where ($1::text is null or e.status = $1)
      order by e.created_at desc limit $2`,
    [status ?? null, limit],
  )
  return rows
}

/** Renvoyer un e-mail en échec ou ignoré : remis en file, compteur à zéro */
export async function requeueEmail(id) {
  const { rows } = await query(
    `update public.email_outbox set status = 'en_attente', attempts = 0, next_attempt_at = now(), last_error = null
      where id = $1 and status in ('echec', 'ignore') returning id`,
    [id],
  )
  return rows[0] ?? null
}

export async function findEmail(id) {
  const { rows } = await query('select id, status from public.email_outbox where id = $1', [id])
  return rows[0] ?? null
}

/** Langue et e-mail du compte client (une commande sans compte reste en français) */
export async function findCustomerProfile(profileId) {
  if (!profileId) return null
  const { rows } = await query('select email, lang, full_name from public.profiles where id = $1', [profileId])
  return rows[0] ?? null
}

/** Rubrique « notifications » des paramètres */
export async function findNotificationSettings() {
  const { rows } = await query(`select value from public.app_settings where key = 'notifications'`)
  return rows[0]?.value ?? null
}
