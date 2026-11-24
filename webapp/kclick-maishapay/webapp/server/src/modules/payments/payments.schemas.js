import { z } from 'zod'

export const listQuery = z.object({
  status: z.enum(['en_attente', 'paye', 'echoue', 'rembourse', 'annule']).optional(),
  kind: z.enum(['paiement', 'remboursement']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().max(80).optional(), // numéro de commande, référence, client
})

export const paymentParams = z.object({ id: z.uuid() })
export const providerParams = z.object({ provider: z.enum(['maishapay']) })

const phone = z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, 'Téléphone invalide')
const orderNumber = z.string().trim().toUpperCase().regex(/^KC-\d{5,}$/, 'Numéro de commande invalide')

// Lancer (ou relancer) le paiement d'une commande : numéro + téléphone de la commande, comme le suivi sans compte
export const startBody = z.object({
  number: orderNumber,
  phone,
  provider: z.string().trim().max(40).optional(),   // autre opérateur pour réessayer
  payerPhone: phone.optional(),                      // autre numéro mobile money pour réessayer
})
export const statusParams = z.object({ number: orderNumber })
export const statusQuery = z.object({ phone })

// Confirmation manuelle (en attendant le prestataire) : la référence de la transaction est obligatoire
export const confirmBody = z.object({
  providerRef: z.string().trim().min(3, 'Référence de la transaction obligatoire'),
  note: z.string().trim().max(300).optional(),
})
export const failBody = z.object({ reason: z.string().trim().min(3, 'Motif obligatoire').max(300) })
