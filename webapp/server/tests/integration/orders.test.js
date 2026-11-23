import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createTestDatabase, createUser } from '../db.js'

const { createApp } = await import('../../src/app.js')
const orders = await import('../../src/modules/orders/orders.service.js')
const app = createApp()
let db, box, ccd03_250, ccd03_1kg, kyraVariant, patchiBrandId

const variantOf = async (ref, label) =>
  (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.ref = $1 and v.label = $2`, [ref, label])).rows[0].id
const boxStock = async () => (await db.query('select stock from public.product_variants where id = $1', [box])).rows[0].stock
const kgStock = async () => Number((await db.query(`select stock_kg from public.products where ref = 'CCD03'`)).rows[0].stock_kg)

before(async () => {
  db = await createTestDatabase()
  box = await variantOf('GSB0010', 'Standard') // petite boîte 100 g, 17,83 $, à la pièce
  ccd03_250 = await variantOf('CCD03', '250 g') // Capricio au poids, 96,09 $ le kg
  ccd03_1kg = await variantOf('CCD03', '1 kg')
  kyraVariant = (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.slug = 'chanel-n5-deodorant'`)).rows[0].id
  patchiBrandId = (await db.query(`select id from public.brands where slug = 'patchi'`)).rows[0].id
  await db.query('update public.product_variants set stock = 40 where id = $1', [box])
  await db.query(`update public.products set stock_kg = 10 where ref = 'CCD03'`)
})

const checkout = (overrides = {}) => ({
  customer: { name: 'Aline Mbuyi', phone: '+243 810 000 000', email: 'aline@example.com' },
  mode: 'livraison',
  address: { commune: 'Gombe', street: '12 avenue du Commerce', landmark: 'En face de la banque' },
  paymentMethod: 'mobile_money',
  provider: 'M-Pesa',
  payerPhone: '+243 810 000 000',
  items: [
    { variantId: box, quantity: 1, giftMessage: 'Joyeux anniversaire' },
    { variantId: ccd03_250, quantity: 2 },
  ],
  ...overrides,
})

test('commande Patchi : boîte à la pièce + chocolat au poids, totaux et stocks', async () => {
  const [b0, k0] = [await boxStock(), await kgStock()]
  const res = await request(app).post('/api/v1/orders').send(checkout())
  assert.equal(res.status, 201, JSON.stringify(res.body))
  assert.match(res.body.number, /^KC-\d{5}$/)
  assert.equal(res.body.total, 69.87) // 250 g = 24,02 $
  assert.equal(res.body.tab, 'En attente')
  assert.equal(await boxStock(), b0 - 1)
  assert.equal(await kgStock(), k0 - 0.5)

  const { rows: parts } = await db.query('select p.amount_due from public.order_parts p where p.order_id = $1', [res.body.id])
  assert.equal(parts.length, 1)
  assert.equal(parts[0].amount_due, 65.87)
})

test('e-mail obligatoire (connecté ou non) : sans e-mail ou e-mail invalide, la commande est refusée', async () => {
  const { createOrderBody } = await import('../../src/modules/orders/orders.schemas.js')
  const withEmail = (email) => createOrderBody.safeParse(checkout({ customer: { name: 'Aline Mbuyi', phone: '+243 810 000 000', ...(email === undefined ? {} : { email }) } }))
  const issue = (r) => r.error.issues.find((i) => i.path.join('.') === 'customer.email')?.message
  assert.equal(issue(withEmail(undefined)), 'E-mail obligatoire')
  assert.equal(issue(withEmail('   ')), 'E-mail obligatoire')
  assert.equal(issue(withEmail('aline@')), 'E-mail invalide')
  const ok = withEmail('  Aline@Example.com ')
  assert.equal(ok.success, true)
  assert.equal(ok.data.customer.email, 'aline@example.com')
})

test('Maison fermée (Kyra) : « bientôt disponible », rien n’est enregistré', async () => {
  const res = await request(app).post('/api/v1/orders').send(checkout({ items: [{ variantId: kyraVariant, quantity: 1 }] }))
  assert.equal(res.status, 409)
  assert.equal(res.body.error.details[0].code, 'COMING_SOON')
})

test('stock au poids : on ne vend pas plus de kg qu’il n’en reste', async () => {
  await db.query(`update public.products set stock_kg = 1.2 where ref = 'CCD03'`)
  const res = await request(app).post('/api/v1/orders').send(checkout({ items: [{ variantId: ccd03_1kg, quantity: 1 }, { variantId: ccd03_250, quantity: 1 }] }))
  assert.equal(res.status, 409)
  assert.equal(res.body.error.details[0].code, 'OUT_OF_STOCK')
  assert.equal(await kgStock(), 1.2)
  await db.query(`update public.products set stock_kg = 10 where ref = 'CCD03'`)
})

test('retrait : pas de frais, point de retrait Patchi', async () => {
  const res = await request(app).post('/api/v1/orders').send(checkout({ mode: 'retrait', address: undefined, items: [{ variantId: box, quantity: 1 }] }))
  assert.equal(res.status, 201)
  assert.equal(res.body.total, 17.83)
  const { rows } = await db.query('select b.slug from public.orders o join public.brands b on b.id = o.pickup_brand_id where o.id = $1', [res.body.id])
  assert.equal(rows[0].slug, 'patchi')
})

test('paiement à la livraison refusé, mobile money sans opérateur refusé, carte acceptée', async () => {
  let res = await request(app).post('/api/v1/orders').send(checkout({ paymentMethod: 'especes' }))
  assert.equal(res.status, 400)
  res = await request(app).post('/api/v1/orders').send(checkout({ provider: undefined }))
  assert.equal(res.status, 400)
  res = await request(app).post('/api/v1/orders').send(checkout({ paymentMethod: 'carte', provider: undefined, payerPhone: undefined }))
  assert.equal(res.status, 201)
})

test('suivi sans compte : numéro + téléphone (format libre), jamais avec un autre numéro', async () => {
  const placed = await orders.placeOrder(null, checkout())
  let res = await request(app).get(`/api/v1/orders/track/${placed.number}?phone=0810000000`)
  assert.equal(res.status, 200, JSON.stringify(res.body))
  assert.equal(res.body.displayStatus, 'nouvelle')
  assert.equal(res.body.timeline[0].label, 'Commande reçue')
  assert.equal(res.body.customer, undefined)
  res = await request(app).get(`/api/v1/orders/track/${placed.number}?phone=0999999999`)
  assert.equal(res.status, 404)
})

test('client connecté : « mes commandes », détail, annulation avec stocks remis (pièce et kg)', async () => {
  const client = await createUser(db, { name: 'Client' })
  const placed = await orders.placeOrder(client, checkout())
  const [b0, k0] = [await boxStock(), await kgStock()]

  const mine = await orders.listMyOrders(client, 'en_attente')
  assert.equal(mine.length, 1)
  assert.equal(mine[0].brands, 'Patchi')

  const detail = await orders.getOrder(client, placed.id)
  assert.equal(detail.parts[0].items.length, 2)
  assert.equal(detail.canCancel, true)

  await orders.cancelOrder(client, placed.id, 'Erreur')
  assert.equal(await boxStock(), b0 + 1)
  assert.equal(await kgStock(), k0 + 0.5)
  await assert.rejects(orders.cancelOrder(client, placed.id), { code: 'ORDER_CLOSED' })
})

test('droits : un employé Patchi voit sa part sans le paiement détaillé ; un inconnu ne voit rien', async () => {
  const placed = await orders.placeOrder(null, checkout())
  const employee = await createUser(db, { roles: [{ role: 'employe', brandId: patchiBrandId }] })
  const view = await orders.getOrder(employee, placed.id)
  assert.deepEqual(view.parts.map((p) => p.brand), ['patchi'])
  assert.equal(view.payment.ref, undefined)

  const stranger = await createUser(db)
  await assert.rejects(orders.getOrder(stranger, placed.id), { code: 'NOT_FOUND' })
})

test('liste admin : recherche par numéro et onglet', async () => {
  const placed = await orders.placeOrder(null, checkout())
  const list = await orders.listAll({ search: placed.number, date: 'today', limit: 10, offset: 0 })
  assert.equal(list.items[0].number, placed.number)
  assert.equal(list.items[0].displayStatus, 'nouvelle')
  const tab = await orders.listAll({ tab: 'terminees', date: 'all', limit: 50, offset: 0 })
  assert.ok(tab.items.every((o) => ['livree', 'retiree'].includes(o.status)))
})
