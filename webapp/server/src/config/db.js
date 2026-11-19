import pg from 'pg'
import { env, isProd } from './env.js'
import { logger } from './logger.js'

// Les montants (numeric) arrivent en texte par défaut : on les convertit en nombre.
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)))

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  ssl: isProd || env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
})

pool.on('error', (err) => logger.error({ err }, 'Erreur sur une connexion PostgreSQL inactive'))

// Les tests remplacent la base réelle par une base PostgreSQL en mémoire (voir tests/db.js)
let source = pool
export const useDatabase = (db) => {
  source = db
}

/** Requête simple : const { rows } = await query('select … where id = $1', [id]) */
export const query = (text, params) => source.query(text, params)

/**
 * Transaction : tout réussit ou rien n'est enregistré.
 *   await transaction(async (client) => { await client.query(…); await client.query(…) })
 */
export async function transaction(work) {
  const client = await source.connect()
  try {
    await client.query('begin')
    const result = await work(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }
}
