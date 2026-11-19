import { logger } from '../../../config/logger.js'

// Prestataire sms à brancher. En attendant, le message est seulement écrit dans les journaux.
export async function send({ phone, title, body }) {
  logger.info({ channel: 'sms', phone, title, body }, 'Notification non envoyée (prestataire à brancher)')
}
