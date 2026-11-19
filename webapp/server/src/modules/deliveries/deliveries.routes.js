import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import * as controller from './deliveries.controller.js'

// Livraisons : attribution, collecte, remise, cash
export const deliveriesRoutes = Router()

deliveriesRoutes.get('/mine', requireAuth, requireRole('livreur'), controller.mine) // Courses du livreur
deliveriesRoutes.post('/', requireAuth, requireRole('employe'), controller.assign) // Attribuer un livreur (toutes les parts prêtes)
deliveriesRoutes.post('/:id/delivered', requireAuth, requireRole('livreur'), controller.delivered) // Commande remise au client (+ espèces encaissées)
deliveriesRoutes.get('/cash', requireAuth, requireRole('livreur', 'employe'), controller.cash) // Cash à remettre / remis par brand
deliveriesRoutes.post('/cash/:id/confirm', requireAuth, requireRole('employe'), controller.confirmCash) // La brand confirme le cash reçu
