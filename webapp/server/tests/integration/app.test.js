import '../setup.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { createApp } = await import('../../src/app.js')
const app = createApp()

test('GET /health répond', async () => {
  const res = await request(app).get('/health')
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { ok: true })
})

test('route inconnue : erreur claire avec un identifiant de requête', async () => {
  const res = await request(app).get('/api/v1/inconnue')
  assert.equal(res.status, 404)
  assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND')
  assert.ok(res.body.error.requestId)
})

test('checkout invalide : liste des champs à corriger', async () => {
  const res = await request(app).post('/api/v1/orders').send({ mode: 'livraison', items: [] })
  assert.equal(res.status, 400)
  assert.equal(res.body.error.code, 'VALIDATION_FAILED')
  assert.ok(res.body.error.details.some((d) => d.field === 'items'))
})

test('route protégée sans connexion : 401', async () => {
  const res = await request(app).get('/api/v1/dashboards/admin')
  assert.equal(res.status, 401)
  assert.equal(res.body.error.code, 'UNAUTHORIZED')
})

test('catalogue : recherche trop courte refusée avant la base', async () => {
  const res = await request(app).get('/api/v1/catalog/products?search=a')
  assert.equal(res.status, 400)
  assert.equal(res.body.error.details[0].field, 'search')
})

test('catalogue : tri inconnu refusé', async () => {
  const res = await request(app).get('/api/v1/catalog/products?sort=hasard')
  assert.equal(res.status, 400)
})
