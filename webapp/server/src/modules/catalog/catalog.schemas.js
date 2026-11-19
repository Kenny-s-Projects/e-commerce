import { z } from 'zod'

export const listProductsQuery = z.object({
  brand: z.string().optional(),            // slug : kyra, patchi, adidas, celio
  category: z.string().optional(),         // slug de rayon
  search: z.string().trim().min(2).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(48),
  offset: z.coerce.number().int().min(0).default(0),
})

export const productParams = z.object({ slug: z.string().min(1) })
