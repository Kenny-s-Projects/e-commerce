import { existsSync } from 'node:fs'
import { z } from 'zod'

// Charge webapp/server/.env s'il existe (npm start comme npm run dev).
// Sur Railway / Render, les variables viennent de la plateforme : pas de fichier .env.
const envFile = new URL('../../.env', import.meta.url)
if (existsSync(envFile)) process.loadEnvFile(envFile)

// Toutes les variables d'environnement sont vérifiées au démarrage :
// si une valeur manque, le serveur s'arrête tout de suite avec un message clair.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL manquante (voir .env.example)'),
  SUPABASE_URL: z.url('SUPABASE_URL doit être une URL'),
  SUPABASE_JWT_SECRET: z.string().optional().transform((v) => v || undefined),
  // E-mails (Resend) : sans clé, rien n'est envoyé (les e-mails sont seulement journalisés)
  RESEND_API_KEY: z.string().optional().transform((v) => v || undefined),
  EMAIL_FROM: z.string().default('kclick <commandes@notification.kclick-api.com>'),
  EMAIL_REPLY_TO: z.string().default('ecommerce@kennysinternational.com'),
  PUBLIC_SITE_URL: z.string().default('http://localhost:5173').transform((v) => v.replace(/\/$/, '')),
  // Paiements MaishaPay : sans les deux clés, les paiements restent confirmés à la main (dashboard)
  MAISHAPAY_PUBLIC_KEY: z.string().optional().transform((v) => v || undefined),
  MAISHAPAY_SECRET_KEY: z.string().optional().transform((v) => v || undefined),
  MAISHAPAY_MODE: z.enum(['0', '1']).default('0'), // 0 : test (sandbox), 1 : réel (live)
  MAISHAPAY_API_URL: z.url().default('https://marchand.maishapay.online/api').transform((v) => v.replace(/\/$/, '')),
  // Adresse publique de cette API (MaishaPay y envoie le résultat des paiements), ex. https://xxx.up.railway.app
  API_PUBLIC_URL: z.string().optional().transform((v) => (v ? v.replace(/\/$/, '') : undefined)),
  PAYMENT_TIMEOUT_MINUTES: z.coerce.number().int().min(2).max(60).default(10),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Configuration invalide :')
  if (!existsSync(envFile)) console.error('  (aucun fichier .env trouvé : copiez .env.example en .env dans webapp/server et remplissez-le)')
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')} : ${issue.message}`)
  process.exit(1)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
