import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createTestDatabase, createUser } from '../db.js'

const { createApp } = await import('../../src/app.js')
const orders = await import('../../src/modules/orders/orders.service.js')
const payments = await import('../../src/modules/payments/payments.service.js')
const { transaction } = await import('../../src/config/db.js')
const app = createApp()
let db, admin, variant

const order = () =>
  orders.placeOrder(null, {
    customer: { name: 'Test', phone: '+243810000000' },
    mode: 'retrait',
    paymentMethod: 'mobile_money',
    provider: 'Orange Money',
    payerPhone: '+243810000000',
    items: [{ variantId: variant, quantity: 1 }],
  })
const paymentOf = async (orderId, kind = 'paiement') =>
  (await db.query('select * from public.payments where order_id = $1 and kind = $2 order by created_at', [orderId, kind])).rows

before(async () => {
  db = await createTestDatabase()
  admin = await createUser(db, { roles: [{ role: 'super_admin' }] })
  variant = (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.slug = 'chanel-n5-deodorant'`)).rows[0].id
  await db.query('update public.product_variants set stock = 100 where id = $1', [variant])
})

test('routes de paiement réservées au super-admin, prestataire pas encore branché', async () => {
  assert.equal((await request(app).get('/api/v1/payments')).status, 401)
  const hook = await request(app).post('/api/v1/payments/webhooks/mobile_money').send({})
  assert.equal(hook.status, 501)
  assert.equal((await request(app).post('/api/v1/payments/webhooks/especes').send({})).status, 400)
})

test('confirmer un paiement : payé, avec la référence, une seule fois', async () => {
  const o = await order()
  const [pending] = await paymentOf(o.id)
  const confirmed = await payments.confirm(admin, pending.id, { providerRef: 'OM-123456' })
  assert.equal(confirmed.status, 'paye')
  assert.equal(confirmed.provider_ref, 'OM-123456')
  assert.ok(confirmed.paid_at)
  await assert.rejects(payments.confirm(admin, pending.id, { providerRef: 'OM-123456' }), { code: 'PAYMENT_NOT_PENDING' })

  const list = await payments.list({ status: 'paye', limit: 50, offset: 0 })
  assert.ok(list.items.some((p) => p.id === pending.id && p.order_number === o.number))
})

test('paiement échoué : marqué en échec et un nouveau paiement en attente est prêt', async () => {
  const o = await order()
  const [pending] = await paymentOf(o.id)
  await payments.fail(admin, pending.id, { reason: 'Solde insuffisant' })
  const rows = await paymentOf(o.id)
  assert.deepEqual(rows.map((r) => r.status), ['echoue', 'en_attente'])
  assert.equal(rows[1].amount, 93)
})

test('annulation après paiement : remboursement à faire, puis effectué', async () => {
  const o = await order()
  const [pending] = await paymentOf(o.id)
  await payments.confirm(admin, pending.id, { providerRef: 'MP-1' })
  await orders.cancelOrder(admin, o.id, 'Rupture')

  const todo = await payments.refunds({ limit: 50, offset: 0 })
  const refund = todo.items.find((r) => r.order_id === o.id)
  assert.equal(refund.amount, 93)
  await assert.rejects(payments.confirm(admin, refund.id, { providerRef: 'x12' }), { code: 'NOT_A_PAYMENT' })

  const done = await payments.refundDone(admin, refund.id, { providerRef: 'MP-RET-1' })
  assert.equal(done.status, 'rembourse')
  assert.ok(!(await payments.refunds({ limit: 50, offset: 0 })).items.some((r) => r.id === refund.id))
})

test('part refusée : avant paiement le montant baisse, après paiement un remboursement de la part est créé', async () => {
  const o = await order()
  await transaction((tx) => payments.settlePartRefusal(tx, { orderId: o.id, partId: null, method: 'mobile_money', partAmount: 50, newTotal: 43 }))
  assert.equal((await paymentOf(o.id))[0].amount, 43)

  const o2 = await order()
  const [p2] = await paymentOf(o2.id)
  await payments.confirm(admin, p2.id, { providerRef: 'MP-2' })
  const refund = await transaction((tx) => payments.settlePartRefusal(tx, { orderId: o2.id, partId: null, method: 'mobile_money', partAmount: 50, newTotal: 43 }))
  assert.equal(refund.amount, 50)
  assert.equal(refund.status, 'en_attente')
})
