import { AppError } from '../shared/errors.js'
import { isProd } from '../config/env.js'

export function notFoundRoute(req, res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Route inconnue : ${req.method} ${req.originalUrl}`))
}

// Toute erreur finit ici et devient une réponse claire : { error: { code, message, details, requestId } }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const known = err instanceof AppError
  const status = known ? err.status : err.type === 'entity.parse.failed' ? 400 : 500
  const code = known ? err.code : status === 400 ? 'INVALID_JSON' : 'INTERNAL_ERROR'

  if (status >= 500) req.log?.error({ err }, 'Erreur serveur')
  else req.log?.warn({ code, message: err.message }, 'Requête refusée')

  res.status(status).json({
    error: {
      code,
      message: known || !isProd ? err.message : 'Erreur interne',
      ...(err.details ? { details: err.details } : {}),
      requestId: req.id,
    },
  })
}
