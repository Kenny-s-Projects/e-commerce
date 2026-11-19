import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createTestDatabase, createUser } from '../db.js'

const { createApp } = await import('../../src/app.js')
const orders = await import('../../src/modules/orders/orders.service.js')
const app = createApp()
let db, kyraVariant, patchi250, patchiBrandId

const stockOf = async (id) => (await db.query('select stock from public.product_variants where id = $1', [id])).rows[0].stock

before(async () => {
  db = await createTestDatabase()
  kyraVariant = (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.slug = 'chanel-n5-deodorant'`)).rows[0].id
  patchi250 = (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.slug = 'ccd01' and v.label = '250 g'`)).rows[0].id
  patchiBrandId = (await db.query(`select id from public.brands where slug = 'patchi'`)).rows[0].id
  await db.query('update public.product_variants set stock = 40 where id = any($1::uuid[])', [[kyraVariant, patchi250]])
})

const checkout = (overrides = {}) => ({
  customer: { name: 'Aline Mbuyi', phone: '+243 810 000 000', email: 'aline@example.com' },
  mode: 'livraison',
  address: { commune: 'Gombe', street: '12 avenue du Commerce', landmark: 'En face de la banque' },
  paymentMethod: 'mobile_money',
  provider: 'M-Pesa',
  payerPhone: '+243 810 000 000',
  items: [
    { variantId: kyraVariant, quantity: 1, giftMessage: 'Joyeux anniversaire' },
    { variantId: patchi250, quantity: 2 },
  ],
  ...overrides,
})

test('commande sans compte, multi-brands : une commande, une part par brand, totaux et stock', async () => {
  const before = await stockOf(patchi250)
  const res = await request(app).post('/api/v1/orders').send(checkout())
  assert.equal(res.status, 201, JSON.stringify(res.body))
  assert.match(res.body.number, /^KC-\d{5}$/)
  assert.equal(res.body.total, 145) // 93 + 2 × 24 + 4 de livraison
  assert.equal(res.body.tab, 'En attente')

  const { rows: parts } = await db.query('select b.slug, p.amount_due, p.status from public.order_parts p join public.brands b on b.id = p.brand_id where p.order_id = $1 order by b.slug', [res.body.id])
  assert.deepEqual(parts.map((p) => [p.slug, p.amount_due, p.status]), [['kyra', 93, 'en_attente'], ['patchi', 48, 'en_attente']])
  assert.equal(await stockOf(patchi250), before - 2)

  const { rows: pay } = await db.query('select method, provider, amount, status from public.payments where order_id = $1', [res.body.id])
  assert.deepEqual(pay[0], { method: 'mobile_money', provider: 'M-Pesa', amount: 145, status: 'en_attente' })
  const { rows: gift } = await db.query(`select i.gift_message from public.order_items i join public.order_parts p on p.id = i.order_part_id where p.order_id = $1 and i.gift_message is not null`, [res.body.id])
  assert.equal(gift[0].gift_message, 'Joyeux anniversaire')
})

test('le prix envoyé par le navigateur est ignoré, seul le prix en base compte', async () => {
  const res = await request(app).post('/api/v1/orders').send(checkout({ items: [{ variantId: kyraVariant, quantity: 1, price: 1 }] }))
  assert.equal(res.status, 201)
  assert.equal(res.body.total, 97)
})

test('retrait : pas de frais, point de retrait Kyra', async () => {
  const res = await request(app).post('/api/v1/orders').send(checkout({ mode: 'retrait', address: undefined, items: [{ variantId: kyraVariant, quantity: 1 }] }))
  assert.equal(res.status, 201)
  assert.equal(res.body.total, 93)
  const { rows } = await db.query('select b.slug from public.orders o join public.brands b on b.id = o.pickup_brand_id where o.id = $1', [res.body.id])
  assert.equal(rows[0].slug, 'kyra')
})

test('stock insuffisant : rien n’est enregistré et le client sait quoi corriger', async () => {
  const before = await stockOf(patchi250)
  const count = (await db.query('select count(*)::int as n from public.orders')).rows[0].n
  const res = await request(app).post('/api/v1/orders').send(checkout({ items: [{ variantId: kyraVariant, quantity: 1 }, { variantId: patchi250, quantity: 45 }] }))
  assert.equal(res.status, 409)
  assert.equal(res.body.error.code, 'CART_INVALID')
  assert.equal(res.body.error.details[0].code, 'OUT_OF_STOCK')
  assert.equal(await stockOf(patchi250), before)
  assert.equal((await db.query('select count(*)::int as n from public.orders')).rows[0].n, count)
})

test('paiement à la livraison refusé, mobile money sans opérateur refusé', async () => {
  let res = await request(app).post('/api/v1/orders').send(checkout({ paymentMethod: 'especes' }))
  assert.equal(res.status, 400)
  res = await request(app).post('/api/v1/orders').send(checkout({ provider: undefined }))
  assert.equal(res.status, 400)
  assert.ok(res.body.error.details.some((d) => d.field === 'provider'))
  res = await request(app).post('/api/v1/orders').send(checkout({ paymentMethod: 'carte', provider: undefined, payerPhone: undefined }))
  assert.equal(res.status, 201)
})

test('client connecté : « mes commandes », détail, annulation avec stock remis', async () => {
  const client = await createUser(db, { name: 'Client' })
  const placed = await orders.placeOrder(client, checkout())
  const before = await stockOf(patchi250)

  const mine = await orders.listMyOrders(client, 'en_attente')
  assert.equal(mine.length, 1)
  assert.equal(mine[0].brands, 'Kyra, Patchi')

  const detail = await orders.getOrder(client, placed.id)
  assert.equal(detail.parts.length, 2)
  assert.equal(detail.canCancel, true)

  const cancelled = await orders.cancelOrder(client, placed.id, 'Erreur de taille')
  assert.equal(cancelled.status, 'annulee')
  assert.equal(await stockOf(patchi250), before + 2)
  const { rows } = await db.query('select status from public.payments where order_id = $1', [placed.id])
  assert.equal(rows[0].status, 'annule')
  await assert.rejects(orders.cancelOrder(client, placed.id), { code: 'ORDER_CLOSED' })
})

test('commande déjà payée puis annulée par le super-admin : remboursement créé', async () => {
  const admin = await createUser(db, { roles: [{ role: 'super_admin' }] })
  const placed = await orders.placeOrder(null, checkout())
  await db.query(`update public.payments set status = 'paye', paid_at = now() where order_id = $1`, [placed.id])
  await db.query(`update public.orders set status = 'en_cours' where id = $1`, [placed.id])
  const res = await orders.cancelOrder(admin, placed.id, 'Client injoignable')
  assert.equal(res.refund, 145)
})

test('droits : un employé Patchi ne voit que la part Patchi ; un inconnu ne voit rien', async () => {
  const placed = await orders.placeOrder(null, checkout())
  const employee = await createUser(db, { roles: [{ role: 'employe', brandId: patchiBrandId }] })
  const view = await orders.getOrder(employee, placed.id)
  assert.deepEqual(view.parts.map((p) => p.brand), ['patchi'])
  assert.equal(view.payments, undefined)

  const stranger = await createUser(db)
  await assert.rejects(orders.getOrder(stranger, placed.id), { code: 'NOT_FOUND' })
  await assert.rejects(orders.cancelOrder(stranger, placed.id), { code: 'NOT_FOUND' })
})

test('un client ne peut plus annuler une commande en cours non partielle', async () => {
  const client = await createUser(db)
  const placed = await orders.placeOrder(client, checkout())
  await db.query(`update public.orders set status = 'en_cours' where id = $1`, [placed.id])
  await assert.rejects(orders.cancelOrder(client, placed.id), { code: 'FORBIDDEN' })
  await db.query(`update public.orders set is_partial = true where id = $1`, [placed.id])
  const res = await orders.cancelOrder(client, placed.id)
  assert.equal(res.status, 'annulee')
})
