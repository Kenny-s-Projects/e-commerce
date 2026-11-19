import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import * as controller from './users.controller.js'

// Comptes et rôles
export const usersRoutes = Router()

usersRoutes.get('/me', requireAuth, controller.me) // Mon profil et mes rôles (décide du dashboard)
usersRoutes.patch('/me', requireAuth, controller.updateMe) // Modifier mon nom, téléphone, langue
usersRoutes.get('/', requireAuth, requireRole('super_admin'), controller.list) // Liste des comptes
usersRoutes.post('/:id/roles', requireAuth, requireRole('super_admin'), controller.addRole) // Donner un rôle (employé d’une brand, livreur…)
usersRoutes.delete('/:id/roles/:roleId', requireAuth, requireRole('super_admin'), controller.removeRole) // Retirer un rôle
