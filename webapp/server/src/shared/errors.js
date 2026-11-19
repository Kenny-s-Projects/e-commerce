// Erreurs métier : chaque erreur a un code lisible, retrouvé dans la réponse et les journaux.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (code, message, details) => new AppError(400, code, message, details)
export const unauthorized = (message = 'Connexion requise') => new AppError(401, 'UNAUTHORIZED', message)
export const forbidden = (message = 'Accès refusé') => new AppError(403, 'FORBIDDEN', message)
export const notFound = (what = 'Ressource') => new AppError(404, 'NOT_FOUND', `${what} introuvable`)
export const conflict = (code, message, details) => new AppError(409, code, message, details)
export const notImplemented = () => new AppError(501, 'NOT_IMPLEMENTED', 'Pas encore disponible')
