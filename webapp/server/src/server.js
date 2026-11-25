import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { pool } from './config/db.js'
import { startEmailWorker, stopEmailWorker } from './modules/notifications/notifications.service.js'
import { startPaymentWorker, stopPaymentWorker } from './modules/payments/payments.service.js'

const server = createApp().listen(env.PORT, () => logger.info(`API kclick prête sur le port ${env.PORT}`))

// File d'envoi des e-mails (Resend) : passe toutes les 10 s
startEmailWorker()

// Paiements MaishaPay en attente : revérifiés toutes les minutes (si un message de MaishaPay se perd)
startPaymentWorker()

// Arrêt propre (Railway / Render envoient SIGTERM à chaque déploiement)
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    logger.info(`${signal} reçu, arrêt en cours…`)
    stopEmailWorker()
    stopPaymentWorker()
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  })
}
