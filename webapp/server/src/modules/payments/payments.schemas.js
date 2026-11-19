import { z } from 'zod'

export const listQuery = z.object({
  status: z.enum(['en_attente', 'paye', 'echoue', 'rembourse', 'annule']).optional(),
  kind: z.enum(['paiement', 'remboursement']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const paymentParams = z.object({ id: z.uuid() })
export const providerParams = z.object({ provider: z.enum(['mobile_money', 'carte']) })

// Confirmation manuelle (en attendant le prestataire) : la référence de la transaction est obligatoire
export const confirmBody = z.object({
  providerRef: z.string().trim().min(3, 'Référence de la transaction obligatoire'),
  note: z.string().trim().max(300).optional(),
})
export const failBody = z.object({ reason: z.string().trim().min(3, 'Motif obligatoire').max(300) })
