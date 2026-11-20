/*
 * API de développement sur une base PostgreSQL EN MÉMOIRE (PGlite) avec toutes les migrations.
 * Sert à tester le site et le dashboard sans toucher à la vraie base Supabase.
 *
 *   npm run dev:memory            → API sur http://localhost:4000 (ou PORT)
 *
 * Au démarrage, des comptes d'équipe de test sont créés et leurs jetons de connexion sont affichés
 * (signés avec un secret de développement, valables 12 h). Les données sont perdues à l'arrêt.
 */
process.env.NODE_ENV ??= 'development'
process.env.DATABASE_URL ??= 'postgresql://memoire:memoire@localhost:5432/memoire'
process.env.SUPABASE_URL ??= 'https://lyroyrwrufgpeagjtzgv.supabase.co'
process.env.SUPABASE_JWT_SECRET ??= 'secret-de-developpement-kclick-0123456789'
process.env.CORS_ORIGINS ??= 'http://localhost:5173,http://localhost:4173'

const { SignJWT } = await import('jose')
const { createTestDatabase } = await import('../tests/db.js')
const { createApp } = await import('../src/app.js')
<<<<<<< HEAD
const { startEmailWorker } = await import('../src/modules/notifications/notifications.service.js')
=======
>>>>>>> 4c11913 (Front : client de l'API et connexion Supabase ; API de développement en mémoire)

const db = await createTestDatabase()

async function staff(email, fullName, role, brandSlug) {
  const brandId = brandSlug ? (await db.query('select id from public.brands where slug = $1', [brandSlug])).rows[0].id : null
  await db.query('insert into public.staff_invitations (email, role, brand_id) values ($1, $2, $3) on conflict (email) do nothing', [email, role, brandId])
  const { rows } = await db.query(
    `insert into auth.users (email, raw_user_meta_data) values ($1, jsonb_build_object('full_name', $2::text)) returning id`,
    [email, fullName],
  )
  return { id: rows[0].id, email }
}

const token = (u) =>
  new SignJWT({ email: u.email, role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(u.id)
    .setIssuer(`${process.env.SUPABASE_URL}/auth/v1`)
    .setAudience('authenticated')
    .setExpirationTime('12h')
    .sign(new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET))

// ecommerce@kennysinternational.com est déjà invité comme super admin par la migration
const users = {
  admin: await staff('ecommerce@kennysinternational.com', 'Kenny’s International', 'super_admin'),
  patchi: await staff('employe.patchi@exemple.com', 'Esther Kanza', 'employe', 'patchi'),
  livreur: await staff('livreur@exemple.com', 'Glody Kabeya', 'livreur'),
  client: await staff('client@exemple.com', 'Merveille Kabongo', 'super_admin').then(async (u) => {
    await db.query(`delete from public.user_roles where user_id = $1 and role <> 'client'`, [u.id])
    return u
  }),
}
await db.query('update public.riders set is_available = true')

<<<<<<< HEAD
startEmailWorker() // sans RESEND_API_KEY, les e-mails sont seulement journalisés
=======
>>>>>>> 4c11913 (Front : client de l'API et connexion Supabase ; API de développement en mémoire)
const port = Number(process.env.PORT ?? 4000)
createApp().listen(port, async () => {
  console.log(`\nAPI en mémoire prête : http://localhost:${port}/api/v1`)
  console.log('Jetons de test (en-tête Authorization: Bearer …) :')
  for (const [name, u] of Object.entries(users)) console.log(`  ${name.padEnd(8)} ${u.email}\n           ${await token(u)}`)
  console.log('')
})
