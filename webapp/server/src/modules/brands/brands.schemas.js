import { z } from 'zod'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure au format HH:MM').nullable().optional()

export const slugParams = z.object({ slug: z.string().min(1) })

// Paramètres › Maisons : ouverture (« bientôt disponible » quand fermée) et point de retrait
export const updateBody = z
  .object({
    isOpen: z.boolean().optional(),
    isPickupPoint: z.boolean().optional(),
    pickupAddress: z.string().trim().max(200).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'Rien à modifier')

// Horaires de la semaine (0 = dimanche) ; un jour absent = fermé
export const hoursBody = z.object({
  hours: z
    .array(z.object({ weekday: z.number().int().min(0).max(6), opensAt: time, closesAt: time, lastOrderAt: time }))
    .max(7)
    .refine((h) => new Set(h.map((x) => x.weekday)).size === h.length, 'Un jour apparaît deux fois'),
})
