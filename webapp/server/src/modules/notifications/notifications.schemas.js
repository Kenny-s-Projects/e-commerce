import { z } from 'zod'

// File d'envoi des e-mails (super admin)
export const emailsQuery = z.object({
  status: z.enum(['en_attente', 'envoye', 'echec', 'ignore']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})
export const emailParams = z.object({ id: z.uuid() })
