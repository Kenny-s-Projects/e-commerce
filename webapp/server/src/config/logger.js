import pino from 'pino'
import { env, isProd } from './env.js'

// Journaux JSON en production (lisibles par Railway / Render), en couleur en développement.
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.card'],
  ...(isProd || env.NODE_ENV === 'test'
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } }),
})
