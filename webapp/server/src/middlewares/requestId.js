import { randomUUID } from 'node:crypto'

// Un identifiant par requête, renvoyé dans l'en-tête X-Request-Id et présent dans chaque ligne de journal.
export function requestId(req, res, next) {
  req.id = req.get('x-request-id') || randomUUID()
  res.set('x-request-id', req.id)
  next()
}
