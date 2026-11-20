import { env } from '../../../config/env.js'

// Envoi d'un e-mail par l'API Resend (https://resend.com/docs/api-reference/emails/send-email).
// La clé est lue au moment de l'envoi : RESEND_API_KEY dans webapp/server/.env (jamais dans Git).

export const hasEmailProvider = () => Boolean(process.env.RESEND_API_KEY)

export class EmailError extends Error {
  constructor(message, { retryable = true } = {}) {
    super(message)
    this.retryable = retryable
  }
}

/** Envoie un e-mail ; renvoie l'identifiant Resend. Lève EmailError en cas d'échec. */
export async function sendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new EmailError('RESEND_API_KEY manquante', { retryable: false })

  let res
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], reply_to: env.EMAIL_REPLY_TO, subject, html, text }),
    })
  } catch (err) {
    throw new EmailError(`Resend injoignable : ${err.message}`)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // 4xx (adresse invalide, domaine non vérifié…) : inutile de réessayer, sauf trop de requêtes (429)
    const retryable = res.status >= 500 || res.status === 429
    throw new EmailError(`Resend ${res.status} : ${data.message ?? data.name ?? 'erreur'}`, { retryable })
  }
  return data.id ?? null
}
