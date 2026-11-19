import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import * as controller from './dashboards.controller.js'

// Vue d'ensemble du super-admin.
// Les autres espaces ont leurs propres routes : client → GET /orders/mine, employé → GET /parts,
// livreur → GET /deliveries/mine (l'ancienne route publique /dashboards/dashboard a été retirée : elle exposait des commandes).
export const dashboardsRoutes = Router()

dashboardsRoutes.get('/admin', requireAuth, requireRole('super_admin'), controller.admin)
