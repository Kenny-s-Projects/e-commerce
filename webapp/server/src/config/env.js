import { z } from 'zod'

// Toutes les variables d'environnement sont vérifiées au démarrage :
// si une valeur manque, le serveur s'arrête tout de suite avec un message clair.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL manquante (voir .env.example)'),
  SUPABASE_URL: z.url('SUPABASE_URL doit être une URL'),
  SUPABASE_JWT_SECRET: z.string().optional().transform((v) => v || undefined),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Configuration invalide :')
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')} : ${issue.message}`)
  process.exit(1)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
