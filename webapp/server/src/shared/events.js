import { EventEmitter } from 'node:events'
import { logger } from '../config/logger.js'

/**
 * Bus d'événements interne. Un module annonce ce qui s'est passé, les autres réagissent :
 *   events.emit('part.refused', { orderId, partId, reason })
 *   events.on('part.refused', async (payload) => { … })   // dans notifications, payments…
 * Une erreur dans un abonné est journalisée sans faire échouer la requête d'origine.
 */
const bus = new EventEmitter()

export const events = {
  emit(name, payload) {
    logger.debug({ event: name, payload }, 'événement')
    bus.emit(name, payload)
  },
  on(name, handler) {
    bus.on(name, (payload) =>
      Promise.resolve()
        .then(() => handler(payload))
        .catch((err) => logger.error({ err, event: name }, 'Erreur dans un abonné')),
    )
  },
}
