import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { requestId } from './middlewares/requestId.js'
import { apiLimiter } from './middlewares/rateLimit.js'
import { errorHandler, notFoundRoute } from './middlewares/errorHandler.js'
import { routes } from './routes.js'
import './modules/subscribers.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1) // derrière le proxy de Railway / Render

  app.use(requestId)
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: { ignore: (req) => req.url === '/health' },
      // Journaux courts : méthode, URL, statut, durée (pas les en-têtes)
      serializers: { req: (req) => ({ id: req.id, method: req.method, url: req.url }), res: (res) => ({ status: res.statusCode }) },
    }),
  )
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (req, res) => res.json({ ok: true }))
  app.use('/api/v1', apiLimiter, routes)

  app.use(notFoundRoute)
  app.use(errorHandler)
  return app
}
