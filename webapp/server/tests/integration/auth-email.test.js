import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createTestDatabase } from '../db.js'

const { createApp } = await import('../../src/app.js')
const app = createApp()

before(async () => {
  const db = await createTestDatabase()
  await db.query(`insert into auth.users (email) values ('deja.client@exemple.com')`)
})

test('inscription : un e-mail déjà utilisé est signalé, un nouvel e-mail non (casse ignorée)', async () => {
  const known = await request(app).post('/api/v1/auth/email/check').send({ email: 'Deja.Client@exemple.com ' })
  assert.equal(known.status, 200)
  assert.deepEqual(known.body, { exists: true })

  const fresh = await request(app).post('/api/v1/auth/email/check').send({ email: 'nouveau@exemple.com' })
  assert.deepEqual(fresh.body, { exists: false })
})

test('inscription : 3 vérifications, puis attente de 30 minutes', async () => {
  // 2 vérifications déjà faites dans le test précédent (même adresse IP)
  const third = await request(app).post('/api/v1/auth/email/check').send({ email: 'autre@exemple.com' })
  assert.equal(third.status, 200)
  const fourth = await request(app).post('/api/v1/auth/email/check').send({ email: 'encore@exemple.com' })
  assert.equal(fourth.status, 429)
  assert.equal(fourth.body.error.code, 'TOO_MANY_ATTEMPTS')
  assert.match(fourth.body.error.message, /30 minutes/)
})
