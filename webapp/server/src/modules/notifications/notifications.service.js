import { logger } from '../../config/logger.js'
import { notFound, conflict, notImplemented } from '../../shared/errors.js'
import { EmailError, hasEmailProvider, sendEmail } from './channels/email.js'
import * as model from './notifications.model.js'

// Notifications : e-mails transactionnels (Resend) passant par une file d'envoi.
// Un e-mail est d'abord enregistré (email_outbox), puis envoyé en arrière-plan avec plusieurs essais.

// Délais avant le 2e, 3e et 4e essai ; après 4 essais l'e-mail passe en « echec »
export const RETRY_DELAYS_SECONDS = [60, 5 * 60, 30 * 60]
export const MAX_ATTEMPTS = RETRY_DELAYS_SECONDS.length + 1

/** Met un e-mail en file d'envoi. Ne lève jamais d'erreur vers l'appelant. */
export async function queueEmail({ kind, to, subject, html, text, orderId }) {
  if (!to) return null
  try {
    const id = await model.insertEmail({ kind, to, subject, html, text, orderId })
    scheduleSoon()
    return id
  } catch (err) {
    logger.error({ err, kind }, 'E-mail non mis en file')
    return null
  }
}

/** Envoie les e-mails en attente (appelé par le worker, et directement par les tests) */
export async function processOutboxOnce() {
  const due = await model.findDueEmails()
  const result = { sent: 0, failed: 0, ignored: 0 }
  for (const email of due) {
    if (!hasEmailProvider()) {
      logger.info({ kind: email.kind, to: email.to_email, subject: email.subject }, 'E-mail non envoyé : RESEND_API_KEY manquante')
      await model.markIgnored(email.id, 'RESEND_API_KEY manquante')
      result.ignored++
      continue
    }
    try {
      const providerId = await sendEmail({ to: email.to_email, subject: email.subject, html: email.html, text: email.text })
      await model.markSent(email.id, providerId)
      result.sent++
    } catch (err) {
      const attempt = email.attempts + 1
      const retryable = !(err instanceof EmailError) || err.retryable
      const delay = retryable && attempt < MAX_ATTEMPTS ? RETRY_DELAYS_SECONDS[attempt - 1] : null
      await model.markFailed(email.id, err.message, delay)
      logger.warn({ kind: email.kind, attempt, retryInSeconds: delay, error: err.message }, 'Échec d’envoi d’un e-mail')
      result.failed++
    }
  }
  return result
}

/* ---------- Worker : démarré par server.js (jamais dans les tests) ---------- */

let timer = null
let running = false
let soon = null

async function tick() {
  if (running) return
  running = true
  try {
    await processOutboxOnce()
  } catch (err) {
    logger.error({ err }, 'File d’envoi des e-mails')
  } finally {
    running = false
  }
}

/** Envoi rapide après une mise en file (sans attendre le prochain passage) */
function scheduleSoon() {
  if (!timer || soon) return
  soon = setTimeout(() => {
    soon = null
    tick()
  }, 500)
  soon.unref?.()
}

export function startEmailWorker(intervalMs = 10_000) {
  if (timer) return
  timer = setInterval(tick, intervalMs)
  timer.unref?.()
  if (!hasEmailProvider()) logger.warn('RESEND_API_KEY absente : les e-mails sont enregistrés mais pas envoyés')
  tick()
}

export function stopEmailWorker() {
  clearInterval(timer)
  clearTimeout(soon)
  timer = null
  soon = null
}

/* ---------- Routes super admin ---------- */

export const listEmails = (filters) => model.findEmails(filters)

export async function retryEmail(id) {
  const email = await model.findEmail(id)
  if (!email) throw notFound('E-mail')
  const requeued = await model.requeueEmail(id)
  if (!requeued) throw conflict('EMAIL_NOT_RETRYABLE', `Cet e-mail est « ${email.status} » : seuls les e-mails en échec ou ignorés se renvoient`)
  scheduleSoon()
  return { id, status: 'en_attente' }
}

// Notifications dans l'application (à écrire avec les écrans correspondants)
export async function list() { throw notImplemented() }
export async function markRead() { throw notImplemented() }
