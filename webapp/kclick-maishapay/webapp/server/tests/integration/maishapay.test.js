import { before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createTestDatabase, createUser } from '../db.js'

/*
 * Paiements MaishaPay, de bout en bout, avec un FAUX MaishaPay : aucun appel réel.
 * Le faux serveur enregistre chaque demande et répond ce que chaque test lui dicte.
 */
const { createApp } = await import('../../src/app.js')
const orders = await import('../../src/modules/orders/orders.service.js')
const payments = await import('../../src/modules/payments/payments.service.js')
const { configureMaishaPay } = await import('../../src/modules/payments/providers/index.js')
const app = createApp()
let db, admin, variant

const PUBLIC_KEY = 'MP-SBPK-test-public'
const SECRET_KEY = 'MP-SBSK-test-secret'

// Faux MaishaPay
const fake = { calls: [], collect: null, card: null, check: null, down: false }
const reply = (status, body) => ({ status, text: async () => JSON.stringify(body) })
async function fakeFetch(url, init) {
  if (fake.down) throw new TypeError('fetch failed')
  const path = url.replace('https://maishapay.test/api', '')
  const body = JSON.parse(init.body)
  fake.calls.push({ path, body })
  if (path === '/collect/v2/store/mobileMoney') return fake.collect?.(body) ?? reply(202, pendingMomo(body))
  if (path === '/collect/v3/store/card') return fake.card?.(body) ?? reply(202, pendingCard(body))
  if (path.startsWith('/transaction/rest/v2/check')) return fake.check?.(body, path) ?? reply(200, { transactionStatus: 'PENDING', transactionId: body.transactionId })
  return reply(404, { message: 'inconnu' })
}
let txSeq = 1000
const pendingMomo = (b) => ({
  status_code: 202,
  transactionStatus: 'PENDING ', // avec l'espace en trop, comme dans la documentation
  transactionId: ++txSeq,
  originatingTransactionId: b.transactionReference,
  order: { cost: { amount: Number(b.order.amount), frais: 0.4, total: Number(b.order.amount) + 0.4, currency: b.order.currency } },
})
const pendingCard = (b) => ({
  status_code: 202,
  transactionId: ++txSeq,
  originatingTransactionId: b.transactionReference,
  transactionStatus: 'PENDING',
  paymentPage: `https://maishapay.test/api/collect/postRedirectionRequest/${txSeq}`,
})
const checkSays = (status) => (fake.check = (body) => reply(200, { transaction_type: 'C2B | Collect', status_code: status === 'SUCCESS' ? 200 : 400, transactionStatus: status, transactionId: body.transactionId, order: { cost: { frais: 0.4 } } }))

const PHONE = '+243 810 000 000'
const placeOrder = (method = 'mobile_money') =>
  orders.placeOrder(null, {
    customer: { name: 'Aline Mbuyi', phone: PHONE, email: 'aline@exemple.com' },
    mode: 'retrait',
    paymentMethod: method,
    provider: method === 'mobile_money' ? 'Orange Money' : undefined,
    payerPhone: method === 'mobile_money' ? '+243 820 000 000' : undefined,
    items: [{ variantId: variant, quantity: 1 }],
  })
const rowsOf = async (orderId) =>
  (await db.query(`select * from public.payments where order_id = $1 order by created_at`, [orderId])).rows
const eventsOf = async (paymentId) =>
  (await db.query(`select * from public.payment_events where payment_id = $1 order by created_at`, [paymentId])).rows

before(async () => {
  db = await createTestDatabase()
  admin = await createUser(db, { roles: [{ role: 'super_admin' }] })
  variant = (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.ref = 'GSB0010'`)).rows[0].id
  await db.query('update public.product_variants set stock = 500 where id = $1', [variant])
  configureMaishaPay({ publicKey: PUBLIC_KEY, secretKey: SECRET_KEY, mode: '0', apiUrl: 'https://maishapay.test/api', publicApiUrl: 'https://api.kclick.test', fetch: fakeFetch })
})

beforeEach(() => Object.assign(fake, { calls: [], collect: null, card: null, check: null, down: false }))

test('mobile money : demande envoyée à MaishaPay avec les bons champs, une seule fois (double clic)', async () => {
  const o = await placeOrder()
  const res = await request(app).post('/api/v1/payments/start').send({ number: o.number, phone: PHONE })
  assert.equal(res.status, 200, JSON.stringify(res.body))
  assert.equal(res.body.status, 'en_attente')
  assert.equal(res.body.waiting, true)
  assert.equal(res.body.online, true)
  assert.match(res.body.payerPhone, /^\+243 •+00$/)

  assert.equal(fake.calls.length, 1)
  const { path, body } = fake.calls[0]
  assert.equal(path, '/collect/v2/store/mobileMoney')
  assert.equal(body.gatewayMode, 0)
  assert.equal(body.publicApiKey, PUBLIC_KEY)
  assert.match(body.transactionReference, new RegExp(`^${o.number}-[0-9A-F]{6}$`))
  assert.deepEqual(body.order, { amount: '17.83', currency: 'USD', customerFullName: 'Aline Mbuyi', customerEmailAdress: 'aline@exemple.com' })
  assert.deepEqual(body.paymentChannel, { channel: 'MOBILEMONEY', provider: 'ORANGE', walletID: '+243820000000', callbackUrl: 'https://api.kclick.test/api/v1/payments/webhooks/maishapay' })

  const [p] = await rowsOf(o.id)
  assert.equal(p.reference, body.transactionReference)
  assert.equal(p.provider_tx_id, String(txSeq))
  assert.equal(p.fees, 0.4)
  assert.ok(p.started_at && p.expires_at)

  // Deuxième clic : pas de deuxième demande sur le téléphone
  await payments.startPayment({ number: o.number, phone: PHONE })
  assert.equal(fake.calls.length, 1)

  // Les clés ne sont jamais écrites dans le journal
  const journal = JSON.stringify(await eventsOf(p.id))
  assert.ok(!journal.includes(SECRET_KEY) && !journal.includes(PUBLIC_KEY))
  assert.ok(journal.includes('"demande"') && journal.includes('"reponse"'))
})

test('message MaishaPay non fiable : « SUCCESS » reçu mais MaishaPay dit PENDING → rien ne change', async () => {
  const o = await placeOrder()
  await payments.startPayment({ number: o.number, phone: PHONE })
  const [p] = await rowsOf(o.id)
  // Faux message (n'importe qui pourrait l'envoyer) : la vérification répond PENDING
  const hook = await request(app)
    .post('/api/v1/payments/webhooks/maishapay')
    .send({ status_code: 200, transactionStatus: 'SUCCESS', transactionId: Number(p.provider_tx_id), originatingTransactionId: p.reference })
  assert.equal(hook.status, 200)
  assert.equal((await rowsOf(o.id))[0].status, 'en_attente')
  assert.ok(fake.calls.some((c) => c.path.startsWith('/transaction/rest/v2/check')), 'vérification demandée à MaishaPay')
})

const outbox = async (orderId, kind) =>
  (await db.query(`select count(*)::int as n from public.email_outbox where order_id = $1 and kind = $2`, [orderId, kind])).rows[0].n

test('paiement confirmé par MaishaPay : payé, historique, e-mails une seule fois, équipe prévenue au paiement', async () => {
  const o = await placeOrder()
  await new Promise((r) => setTimeout(r, 50))
  assert.equal(await outbox(o.id, 'team_new_order'), 0, 'pas d’alerte à l’équipe avant le paiement')
  await payments.startPayment({ number: o.number, phone: PHONE })
  const [p] = await rowsOf(o.id)
  checkSays('SUCCESS')
  const msg = { status_code: 200, transactionStatus: 'SUCCESS', transactionId: Number(p.provider_tx_id), originatingTransactionId: p.reference }
  await request(app).post('/api/v1/payments/webhooks/maishapay').send(msg)
  await request(app).post('/api/v1/payments/webhooks/maishapay').send(msg) // MaishaPay renvoie le même message

  const [paid] = await rowsOf(o.id)
  assert.equal(paid.status, 'paye')
  assert.equal(paid.provider_ref, p.provider_tx_id)
  assert.ok(paid.paid_at)
  const history = (await db.query(`select to_status from public.order_status_history where order_id = $1`, [o.id])).rows.map((r) => r.to_status)
  assert.ok(history.includes('paiement paye'))
  await new Promise((r) => setTimeout(r, 50))
  assert.equal(await outbox(o.id, 'payment_received'), 1)
  assert.equal(await outbox(o.id, 'team_new_order'), 1)

  const status = await request(app).get(`/api/v1/payments/status/${o.number}`).query({ phone: '0810000000' })
  assert.equal(status.body.status, 'paye')
  assert.equal(status.body.canRetry, false)
})

test('paiement refusé : échec avec le motif, nouvelle tentative possible avec un autre opérateur', async () => {
  const o = await placeOrder()
  await payments.startPayment({ number: o.number, phone: PHONE })
  const [first] = await rowsOf(o.id)
  checkSays('FAILED')
  await request(app).post('/api/v1/payments/webhooks/maishapay').send({ transactionStatus: 'FAILED', transactionId: Number(first.provider_tx_id) })

  const status = await payments.paymentStatus({ number: o.number, phone: PHONE })
  assert.equal(status.status, 'echoue')
  assert.equal(status.failureReason, 'Le paiement n’a pas abouti')
  assert.equal(status.canRetry, true)

  fake.calls = []
  fake.check = null
  const again = await payments.startPayment({ number: o.number, phone: PHONE, provider: 'Airtel Money', payerPhone: '0990000000' })
  assert.equal(again.status, 'en_attente')
  assert.equal(fake.calls[0].body.paymentChannel.provider, 'AIRTEL')
  assert.equal(fake.calls[0].body.paymentChannel.walletID, '+243990000000')
  const rows = await rowsOf(o.id)
  assert.deepEqual(rows.map((r) => r.status), ['echoue', 'en_attente'])
  assert.notEqual(rows[1].reference, rows[0].reference)
})

test('demande refusée tout de suite ou MaishaPay injoignable : échec lisible, on peut réessayer', async () => {
  const o = await placeOrder()
  fake.down = true
  const res = await payments.startPayment({ number: o.number, phone: PHONE })
  assert.equal(res.status, 'echoue')
  assert.match(res.failureReason, /ne répond pas/)
  assert.equal(res.canRetry, true)

  fake.down = false
  fake.collect = (b) => reply(400, { status_code: 400, transactionStatus: 'DECLINED', transactionId: 77, originatingTransactionId: b.transactionReference })
  const again = await payments.startPayment({ number: o.number, phone: PHONE })
  assert.equal(again.status, 'echoue')
  assert.equal(again.failureReason, 'Paiement refusé par l’opérateur')
})

test('délai dépassé : le paiement en attente est marqué échoué par la vérification automatique', async () => {
  const o = await placeOrder()
  await payments.startPayment({ number: o.number, phone: PHONE })
  await db.query(`update public.payments set expires_at = now() - interval '1 minute', checked_at = now() - interval '5 minutes' where order_id = $1`, [o.id])
  await payments.sweepPending()
  const rows = await rowsOf(o.id)
  assert.equal(rows[0].status, 'echoue')
  assert.equal(rows[0].failure_reason, 'Délai de validation dépassé')
  assert.equal(rows[1].status, 'en_attente')
})

test('carte : page de paiement sécurisée, retour du client vérifié puis renvoyé sur le suivi', async () => {
  const o = await placeOrder('carte')
  const res = await payments.startPayment({ number: o.number, phone: PHONE })
  assert.equal(res.method, 'carte')
  assert.match(res.paymentPage, /^https:\/\/maishapay\.test\/api\/collect\/postRedirectionRequest\/\d+$/)
  const { body } = fake.calls[0]
  assert.equal(fake.calls[0].path, '/collect/v3/store/card')
  assert.equal(body.order.customerFirstname, 'Aline')
  assert.equal(body.order.customerLastname, 'Mbuyi')
  assert.equal(body.order.customerPhoneNumber, '+243810000000')
  assert.equal(body.paymentChannel.channel, 'CARD')

  const [p] = await rowsOf(o.id)
  checkSays('SUCCESS')
  const back = await request(app)
    .get('/api/v1/payments/webhooks/maishapay')
    .query({ status: 200, description: 'APPROVED', transactionRefId: p.reference, operatorRefId: p.provider_tx_id })
  assert.equal(back.status, 302)
  assert.match(back.headers.location, new RegExp(`/#suivi/${o.number}$`))
  assert.equal((await rowsOf(o.id))[0].status, 'paye')
})

test('suivi du paiement : téléphone de la commande obligatoire', async () => {
  const o = await placeOrder()
  assert.equal((await request(app).get(`/api/v1/payments/status/${o.number}`).query({ phone: '0999999999' })).status, 404)
  assert.equal((await request(app).post('/api/v1/payments/start').send({ number: o.number, phone: '0999999999' })).status, 404)
  assert.equal((await request(app).get(`/api/v1/payments/status/${o.number}`).query({ phone: '0810000000' })).body.status, 'a_payer')
})

test('payé après l’annulation de la commande : enregistré, et remboursement créé pour l’équipe', async () => {
  const o = await placeOrder()
  await payments.startPayment({ number: o.number, phone: PHONE })
  const [p] = await rowsOf(o.id)
  await orders.cancelOrder(admin, o.id, 'Client injoignable')
  assert.equal((await rowsOf(o.id))[0].status, 'annule')

  checkSays('SUCCESS')
  await request(app).post('/api/v1/payments/webhooks/maishapay').send({ transactionStatus: 'SUCCESS', transactionId: Number(p.provider_tx_id) })
  const refunds = (await db.query(`select * from public.payments where order_id = $1 and kind = 'remboursement'`, [o.id])).rows
  assert.equal((await rowsOf(o.id)).find((r) => r.id === p.id).status, 'paye')
  assert.equal(refunds.length, 1)
  assert.equal(refunds[0].amount, 17.83)
  assert.equal(refunds[0].status, 'en_attente')
})

test('dashboard : liste avec référence, numéro MaishaPay et dernier statut, recherche par commande', async () => {
  const o = await placeOrder()
  await payments.startPayment({ number: o.number, phone: PHONE })
  const list = await payments.list({ q: o.number, limit: 50, offset: 0 })
  assert.equal(list.items.length, 1)
  const [row] = list.items
  assert.match(row.reference, new RegExp(`^${o.number}-`))
  assert.ok(row.provider_tx_id)
  assert.equal(row.provider_status, 'PENDING')

  const http = await request(app).get('/api/v1/payments').query({ q: o.number })
  assert.equal(http.status, 401) // super-admin seulement
})
