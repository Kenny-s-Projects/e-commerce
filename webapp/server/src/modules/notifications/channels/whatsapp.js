import { logger } from '../../../config/logger.js'

// Prestataire whatsapp à brancher. En attendant, le message est seulement écrit dans les journaux.
export async function send({ phone, title, body }) {
  logger.info({ channel: 'whatsapp', phone, title, body }, 'Notification non envoyée (prestataire à brancher)')
}
