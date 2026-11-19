import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import * as controller from './dashboards.controller.js'
// Données des 4 dashboards
export const dashboardsRoutes = Router()

dashboardsRoutes.get('/client', requireAuth, requireRole('client'), controller.client) // Mes commandes par onglet, adresses
dashboardsRoutes.get('/employee', requireAuth, requireRole('employe'), controller.employee) // Compteurs par onglet, parts à traiter, stock bas
dashboardsRoutes.get('/rider', requireAuth, requireRole('livreur'), controller.rider) // Courses du jour, cash à remettre
dashboardsRoutes.get('/admin', requireAuth, requireRole('super_admin'), controller.admin) // Une ligne par commande (multi-brands), ventes par brand, remboursements
dashboardsRoutes.get('/dashboard', controller.DashboardOverview) // Récupérer les données d'un dashboard spécifique