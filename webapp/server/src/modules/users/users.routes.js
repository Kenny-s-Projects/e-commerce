import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { requireRole } from '../../middlewares/requireRole.js'
import { validate } from '../../middlewares/validate.js'
import * as controller from './users.controller.js'
import { idParams, inviteBody, listQuery, updateBody, updateMeBody } from './users.schemas.js'

// Comptes de l'équipe et rôles (super admin), et « mon compte » pour tous
export const usersRoutes = Router()

const admin = [requireAuth, requireRole('super_admin')]

usersRoutes.get('/me', requireAuth, controller.me)                                                          // mon profil et mes rôles
usersRoutes.patch('/me', requireAuth, validate({ body: updateMeBody }), controller.updateMe)                 // nom, téléphone, langue
usersRoutes.get('/', ...admin, validate({ query: listQuery }), controller.list)                              // ?role=&status=&search=
usersRoutes.post('/invitations', ...admin, validate({ body: inviteBody }), controller.invite)                 // inviter une personne
usersRoutes.delete('/invitations/:id', ...admin, validate({ params: idParams }), controller.revoke)           // retirer une invitation
usersRoutes.post('/invitations/:id/resend', ...admin, validate({ params: idParams }), controller.resend)      // renvoyer (e-mail à brancher)
usersRoutes.get('/:id', ...admin, validate({ params: idParams }), controller.get)
usersRoutes.patch('/:id', ...admin, validate({ params: idParams, body: updateBody }), controller.update)      // nom, rôle, Maison…
usersRoutes.post('/:id/deactivate', ...admin, validate({ params: idParams }), controller.deactivate)
usersRoutes.post('/:id/reactivate', ...admin, validate({ params: idParams }), controller.reactivate)
