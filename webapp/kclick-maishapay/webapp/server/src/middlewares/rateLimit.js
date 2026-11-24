import rateLimit from 'express-rate-limit'

// Limite générale, et une plus stricte pour la création de commandes.
export const apiLimiter = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false })
export const orderLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })
// Lancement d'un paiement en ligne (demande envoyée sur le téléphone du client)
export const paymentStartLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })
