// Parcours complet : employé Patchi → dispatch → livreur, refus partiel, retrait, vue d'ensemble admin
import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createTestDatabase, createUser } from '../db.js'

const orders = await import('../../src/modules/orders/orders.service.js')
const parts = await import('../../src/modules/parts/parts.service.js')
const deliveries = await import('../../src/modules/deliveries/deliveries.service.js')
const payments = await import('../../src/modules/payments/payments.service.js')
const dashboards = await import('../../src/modules/dashboards/dashboards.service.js')

let db, box, ccd03, patchi, kyra, admin, employee, riderUser, riderId

const variantOf = async (ref, label) =>
  (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.ref = $1 and v.label = $2`, [ref, label])).rows[0].id

const order = (overrides = {}) =>
  orders.placeOrder(null, {
    customer: { name: 'Merveille Kabongo', phone: '+243810000000', email: 'merveille@exemple.com' },
    mode: 'livraison',
    address: { commune: 'Gombe', street: 'avenue de la Justice', landmark: 'portail bleu' },
    paymentMethod: 'mobile_money',
    provider: 'M-Pesa',
    payerPhone: '+243810000000',
    items: [{ variantId: box, quantity: 1 }, { variantId: ccd03, quantity: 1 }],
    ...overrides,
  })

const partOf = async (orderId, brand = 'patchi') =>
  (await db.query(`select p.id from public.order_parts p join public.brands b on b.id = p.brand_id where p.order_id = $1 and b.slug = $2`, [orderId, brand])).rows[0].id

before(async () => {
  db = await createTestDatabase()
  box = await variantOf('GSB0010', 'Standard')
  ccd03 = await variantOf('CCD03', '250 g')
  await db.query('update public.product_variants set stock = 100 where id = $1', [box])
  await db.query(`update public.products set stock_kg = 50 where ref = 'CCD03'`)
  patchi = (await db.query(`select id from public.brands where slug = 'patchi'`)).rows[0].id
  kyra = (await db.query(`select id from public.brands where slug = 'kyra'`)).rows[0].id
  admin = await createUser(db, { name: 'Admin', roles: [{ role: 'super_admin' }] })
  employee = await createUser(db, { name: 'Esther Kanza', roles: [{ role: 'employe', brandId: patchi }] })
  riderUser = await createUser(db, { name: 'Glody Kabeya', roles: [{ role: 'livreur' }] })
  riderId = (await db.query(`insert into public.riders (profile_id, vehicle, zone, is_available) values ($1, 'Moto', 'Gombe', true) returning id`, [riderUser.id])).rows[0].id
})

test('employé Patchi : file de sa Maison, préparation puis prête (qui et quand)', async () => {
  const o = await order()
  const queue = await parts.listForBrand(employee, {})
  const mine = queue.find((x) => x.id === o.id)
  assert.equal(mine.parts[0].status, 'nouvelle')

  const partId = await partOf(o.id)
  let view = await parts.setStatus(employee, partId, { status: 'en_preparation' })
  assert.equal(view.parts[0].status, 'en_preparation')
  assert.equal(view.parts[0].staff, 'Esther Kanza')
  assert.ok(view.parts[0].startedAt)
  assert.equal(view.displayStatus, 'en_preparation')

  await assert.rejects(parts.setStatus(employee, partId, { status: 'en_preparation' }), { code: 'INVALID_TRANSITION' })
  view = await parts.setStatus(employee, partId, { status: 'prete' })
  assert.equal(view.displayStatus, 'prete')
  assert.equal(view.dispatchable, true)

  // Un employé d'une autre Maison ne peut pas toucher cette part
  const other = await createUser(db, { roles: [{ role: 'employe', brandId: kyra }] })
  await assert.rejects(parts.setStatus(other, partId, { status: 'refusee', reason: 'Test' }), { code: 'NOT_FOUND' })
})

test('dispatch, collecte et livraison', async () => {
  const o = await order()
  const partId = await partOf(o.id)
  await assert.rejects(deliveries.assign(admin, { orderId: o.id, riderId, etaMinutes: 20 }), { code: 'NO_PART_READY' })

  await parts.setStatus(employee, partId, { status: 'en_preparation' })
  await parts.setStatus(employee, partId, { status: 'prete' })
  let view = await deliveries.assign(employee, { orderId: o.id, riderId, etaMinutes: 20 })
  assert.equal(view.displayStatus, 'assignee')
  assert.equal(view.riderId, riderId)

  const list = await deliveries.riders()
  assert.equal(list.find((r) => r.id === riderId).status, 'en_course')

  const mine = await deliveries.mine(riderUser)
  assert.ok(mine.current.some((x) => x.id === o.id))

  await assert.rejects(deliveries.delivered(riderUser, o.id), { code: 'NOT_ON_THE_WAY' })
  view = await deliveries.collect(riderUser, o.id, 'patchi')
  assert.equal(view.displayStatus, 'en_route')
  assert.ok(view.pickedUpAt)
  view = await deliveries.delivered(riderUser, o.id)
  assert.equal(view.displayStatus, 'livree')

  const after = await deliveries.mine(riderUser)
  assert.ok(after.deliveredToday.some((x) => x.id === o.id))
  const stranger = await createUser(db, { roles: [{ role: 'livreur' }] })
  await assert.rejects(deliveries.collect(stranger, o.id, 'patchi'), { code: 'FORBIDDEN' })
})

test('rupture sur la seule part : commande refusée, stock remis, remboursement si payée', async () => {
  const o = await order()
  const [{ id: payId }] = (await db.query(`select id from public.payments where order_id = $1`, [o.id])).rows
  await payments.confirm(admin, payId, { providerRef: 'MP-1' })
  const stock0 = (await db.query('select stock from public.product_variants where id = $1', [box])).rows[0].stock

  const view = await parts.setStatus(employee, await partOf(o.id), { status: 'refusee', reason: 'Rupture de stock' })
  assert.equal(view.parts[0].status, 'refusee')
  assert.equal(view.status, 'refusee')
  assert.equal((await db.query('select stock from public.product_variants where id = $1', [box])).rows[0].stock, stock0 + 1)
  const { rows } = await db.query(`select amount, status from public.payments where order_id = $1 and kind = 'remboursement'`, [o.id])
  assert.equal(rows[0].amount, 41.85)
  await assert.rejects(parts.setStatus(employee, await partOf(o.id), { status: 'refusee', reason: 'x' }), { code: 'INVALID_TRANSITION' })
})

test('refus partiel (commande multi-Maisons) : la commande continue, montant ajusté', async () => {
  // Kyra rouverte le temps du test pour avoir deux Maisons
  await db.query(`update public.brands set is_open = true where slug = 'kyra'`)
  const kyraVariant = (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.slug = 'chanel-n5-deodorant'`)).rows[0].id
  await db.query('update public.product_variants set stock = 10 where id = $1', [kyraVariant])
  const o = await order({ items: [{ variantId: box, quantity: 1 }, { variantId: kyraVariant, quantity: 1 }] })
  await db.query(`update public.brands set is_open = false where slug = 'kyra'`)

  const view = await parts.setStatus(employee, await partOf(o.id), { status: 'refusee', reason: 'Rupture de stock' })
  assert.equal(view.status, 'en_attente')
  assert.equal(view.partial, true)
  assert.equal(view.otherBrands[0].brand, 'kyra')
  const { rows } = await db.query(`select amount from public.payments where order_id = $1 and kind = 'paiement' and status = 'en_attente'`, [o.id])
  assert.equal(rows[0].amount, 97)
})

test('retrait : remise au client quand la part est prête', async () => {
  const o = await order({ mode: 'retrait', address: undefined, items: [{ variantId: box, quantity: 1 }] })
  await assert.rejects(orders.handover(employee, o.id), { code: 'PARTS_NOT_READY' })
  const partId = await partOf(o.id)
  await parts.setStatus(employee, partId, { status: 'en_preparation' })
  await parts.setStatus(employee, partId, { status: 'prete' })
  const view = await orders.handover(employee, o.id)
  assert.equal(view.status, 'retiree')
  assert.equal(view.displayStatus, 'livree')
})

test('vue d’ensemble admin : chiffres du jour, statuts, Maisons, alertes, livreurs', async () => {
  const late = await order()
  const partId = await partOf(late.id)
  await parts.setStatus(employee, partId, { status: 'en_preparation' })
  await db.query(`update public.order_status_history set created_at = now() - interval '30 minutes' where order_part_id = $1 and to_status = 'en_preparation'`, [partId])
  await db.query(`update public.products set stock_kg = 0.1 where ref = 'CCN19'`)

  const d = await dashboards.admin()
  assert.ok(d.kpis.ordersToday >= 5)
  assert.equal(Object.keys(d.byStatus).length, 7)
  assert.ok(d.byStatus.livree >= 2)
  assert.ok(d.kpis.averageDeliveryMinutes !== undefined)
  assert.ok(d.salesByBrand.find((b) => b.brand === 'patchi').amount > 0)
  assert.equal(d.salesByBrand.find((b) => b.brand === 'kyra').isOpen, false)
  assert.ok(d.alerts.some((a) => a.type === 'late' && a.number === late.number))
  assert.ok(d.alerts.some((a) => a.type === 'stock' && a.ref === 'CCN19'))
  assert.ok(d.alerts.some((a) => a.type === 'refused'))
  assert.ok(d.riders.some((r) => r.id === riderId))
  assert.ok(d.latest.length <= 8)
})
