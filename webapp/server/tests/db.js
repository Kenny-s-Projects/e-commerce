// Base PostgreSQL en mémoire (PGlite) avec toutes les migrations : les tests touchent du vrai SQL,
// sans jamais toucher à la base Supabase.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { useDatabase } from '../src/config/db.js'

const MIGRATIONS = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url))

export async function createTestDatabase() {
  const db = new PGlite({ parsers: { 1700: (v) => Number(v) } })
  // Ce que Supabase fournit d'habitude : rôles, schéma auth
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), phone text, email text,
                             raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`)
  for (const file of readdirSync(MIGRATIONS).sort()) await db.exec(readFileSync(MIGRATIONS + file, 'utf8'))

  // Une seule connexion : les transactions passent l'une après l'autre
  let queue = Promise.resolve()
  useDatabase({
    query: (text, params) => db.query(text, params),
    connect: async () => {
      let release
      const turn = new Promise((r) => (release = r))
      const previous = queue
      queue = queue.then(() => turn)
      await previous
      return { query: (text, params) => db.query(text, params), release }
    },
  })
  return db
}

/** Crée un compte (le profil et le rôle client sont créés par le trigger de la base) */
export async function createUser(db, { name = 'Test', roles = [] } = {}) {
  const { rows } = await db.query(
    `insert into auth.users (raw_user_meta_data) values (jsonb_build_object('full_name', $1::text)) returning id`, [name])
  const id = rows[0].id
  for (const r of roles) await db.query('insert into public.user_roles (user_id, role, brand_id) values ($1, $2, $3)', [id, r.role, r.brandId ?? null])
  const { rows: all } = await db.query('select role, brand_id as "brandId" from public.user_roles where user_id = $1', [id])
  return { id, full_name: name, roles: all, has: (role) => all.some((x) => x.role === role),
           brandIds: all.filter((x) => x.role === 'employe').map((x) => x.brandId) }
}
