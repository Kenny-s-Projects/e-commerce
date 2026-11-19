import { z } from 'zod'

export const listProductsQuery = z.object({
  brand: z.string().optional(),            // slug : kyra, patchi, adidas, celio
  category: z.string().optional(),         // slug de rayon (ex. homme-chaussures)
  tag: z.string().optional(),              // ex. Nouveau
  search: z.string().trim().min(2, '2 caractères minimum').optional(),
  inStock: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  sort: z.enum(['default', 'price_asc', 'price_desc', 'name']).default('default'),
  limit: z.coerce.number().int().min(1).max(100).default(48),
  offset: z.coerce.number().int().min(0).default(0),
})

export const productParams = z.object({ slug: z.string().min(1) })
export const brandsQuery = z.object({ brand: z.string().optional() })
