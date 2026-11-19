import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { pool } from './config/db.js'

const server = createApp().listen(env.PORT, () => logger.info(`API kclick prête sur le port ${env.PORT}`))

// Arrêt propre (Railway / Render envoient SIGTERM à chaque déploiement)
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    logger.info(`${signal} reçu, arrêt en cours…`)
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  })
}
