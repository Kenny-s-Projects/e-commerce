import { z } from 'zod'

export const PROVIDERS = ['M-Pesa', 'Orange Money', 'Airtel Money']

// Corps attendu pour POST /api/v1/orders (le checkout du site).
// Carte : aucune donnée de carte ne passe par notre API, elle sera saisie chez le prestataire de paiement.
export const createOrderBody = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, 'Nom obligatoire'),
      phone: z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, 'Téléphone invalide'),
      email: z.email('E-mail invalide').optional().or(z.literal('').transform(() => undefined)),
    }),
    mode: z.enum(['livraison', 'retrait']),
    address: z
      .object({
        commune: z.string().trim().min(2, 'Commune obligatoire'),
        quartier: z.string().trim().optional(),
        street: z.string().trim().min(2, 'Adresse obligatoire'),
        landmark: z.string().trim().optional(),
      })
      .optional(),
    paymentMethod: z.enum(['mobile_money', 'carte'], 'Moyen de paiement : mobile_money ou carte'),
    provider: z.enum(PROVIDERS).optional(),
    payerPhone: z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, 'Numéro mobile money invalide').optional(),
    note: z.string().trim().max(500).optional(),
    items: z
      .array(
        z.object({
          variantId: z.uuid('Article invalide'),
          quantity: z.number().int().min(1).max(50),
          giftMessage: z.string().trim().max(120).optional(),
        }),
      )
      .min(1, 'Panier vide')
      .max(50),
  })
  .superRefine((o, ctx) => {
    if (o.mode === 'livraison' && !o.address)
      ctx.addIssue({ code: 'custom', path: ['address'], message: 'Adresse de livraison obligatoire' })
    if (o.paymentMethod === 'mobile_money' && !o.provider)
      ctx.addIssue({ code: 'custom', path: ['provider'], message: 'Opérateur mobile money obligatoire' })
    if (o.paymentMethod === 'mobile_money' && !o.payerPhone)
      ctx.addIssue({ code: 'custom', path: ['payerPhone'], message: 'Numéro mobile money obligatoire' })
  })

export const orderParams = z.object({ id: z.uuid() })
export const cancelBody = z.object({ reason: z.string().trim().max(300).optional() }).optional()
export const mineQuery = z.object({ tab: z.enum(['en_attente', 'en_cours', 'refusees', 'terminees']).optional() })
