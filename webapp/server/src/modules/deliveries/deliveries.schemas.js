import { z } from 'zod'

export const assignBody = z.object({
  orderId: z.uuid(),
  riderId: z.uuid(),
  etaMinutes: z.number().int().min(1).max(240).optional(),
})
export const orderParams = z.object({ orderId: z.uuid() })
export const collectBody = z.object({ brand: z.string().min(1, 'Maison obligatoire') })
export const availabilityBody = z.object({ available: z.boolean() })
