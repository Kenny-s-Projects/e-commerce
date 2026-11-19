import { z } from 'zod'

export const listQuery = z.object({
  brand: z.string().optional(), // slug ; par défaut la Maison de l'employé
  scope: z.enum(['active', 'today', 'all']).default('active'),
})
export const partParams = z.object({ id: z.uuid() })
export const statusBody = z
  .object({
    status: z.enum(['en_preparation', 'prete', 'refusee'], 'Statut : en_preparation, prete ou refusee'),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((b) => b.status !== 'refusee' || (b.reason && b.reason.length >= 3), { message: 'Motif de refus obligatoire', path: ['reason'] })
