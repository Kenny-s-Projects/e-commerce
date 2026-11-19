import { z } from 'zod'

export const STAFF_ROLES = ['super_admin', 'employe', 'livreur']

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{8,20}$/, 'Téléphone invalide')
  .optional()
  .or(z.literal('').transform(() => undefined))

const staffFields = {
  firstName: z.string().trim().min(1, 'Prénom obligatoire').max(80),
  lastName: z.string().trim().min(1, 'Nom obligatoire').max(80),
  phone,
  role: z.enum(STAFF_ROLES, 'Rôle : super_admin, employe ou livreur'),
  brand: z.string().trim().optional(), // slug de la Maison (employé)
  vehicle: z.string().trim().max(40).optional(),
  zone: z.string().trim().max(60).optional(),
}

const brandRequired = (o, ctx) => {
  if (o.role === 'employe' && !o.brand) ctx.addIssue({ code: 'custom', path: ['brand'], message: 'Maison obligatoire pour un employé' })
}

export const inviteBody = z
  .object({ ...staffFields, email: z.email('E-mail invalide').transform((e) => e.trim().toLowerCase()) })
  .superRefine(brandRequired)

export const updateBody = z.object(staffFields).partial().superRefine((o, ctx) => {
  if (o.role) brandRequired(o, ctx)
})

export const listQuery = z.object({
  role: z.enum(STAFF_ROLES).optional(),
  status: z.enum(['actif', 'invite', 'desactive']).optional(),
  search: z.string().trim().optional(),
})

export const idParams = z.object({ id: z.uuid() })

export const updateMeBody = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone,
  lang: z.enum(['fr', 'en']).optional(),
})
