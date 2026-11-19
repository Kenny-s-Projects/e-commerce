import { z } from 'zod'

// Corps attendu pour POST /api/v1/orders (le checkout du site)
export const createOrderBody = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, 'Nom obligatoire'),
      phone: z.string().trim().min(8, 'Téléphone obligatoire'),
      email: z.email().optional().or(z.literal('')),
    }),
    mode: z.enum(['livraison', 'retrait']),
    address: z
      .object({
        commune: z.string().trim().min(2),
        quartier: z.string().trim().optional(),
        street: z.string().trim().optional(),
        landmark: z.string().trim().optional(),
      })
      .optional(),
    paymentMethod: z.enum(['mobile_money', 'carte', 'especes']),
    provider: z.string().optional(),   // M-Pesa, Orange Money, Airtel Money…
    payerPhone: z.string().optional(),
    note: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          variantId: z.uuid(),
          quantity: z.number().int().min(1).max(50),
          giftMessage: z.string().max(120).optional(),
        }),
      )
      .min(1, 'Panier vide'),
  })
  .refine((o) => o.mode === 'retrait' || o.address, { message: 'Adresse de livraison obligatoire', path: ['address'] })

export const orderParams = z.object({ id: z.uuid() })
export const cancelBody = z.object({ reason: z.string().trim().max(300).optional() })
