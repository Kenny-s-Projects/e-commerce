// E-mails (Resend) : file d'envoi, modèles, réglages, essais successifs. Resend est simulé (fetch).
import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { createTestDatabase, createUser } from '../db.js'

const orders = await import('../../src/modules/orders/orders.service.js')
const parts = await import('../../src/modules/parts/parts.service.js')
const users = await import('../../src/modules/users/users.service.js')
const notifications = await import('../../src/modules/notifications/notifications.service.js')
await import('../../src/modules/subscribers.js') // abonnés aux événements (chargés par app.js en temps normal)

let db, box, patchi, admin, employee
const sent = []
let resendStatus = 200
const realFetch = globalThis.fetch

before(async () => {
  db = await createTestDatabase()
  box = (await db.query(`select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.ref = 'GSB0010'`)).rows[0].id
  await db.query('update public.product_variants set stock = 100 where id = $1', [box])
  patchi = (await db.query(`select id from public.brands where slug = 'patchi'`)).rows[0].id
  admin = await createUser(db, { name: 'Admin', roles: [{ role: 'super_admin' }] })
  employee = await createUser(db, { name: 'Esther Kanza', roles: [{ role: 'employe', brandId: patchi }] })

  globalThis.fetch = async (url, init) => {
    if (!String(url).startsWith('https://api.resend.com/')) return realFetch(url, init)
    const body = JSON.parse(init.body)
    if (resendStatus !== 200) return new Response(JSON.stringify({ name: 'error', message: 'refusé' }), { status: resendStatus })
    sent.push({ ...body, auth: init.headers.Authorization })
    return new Response(JSON.stringify({ id: `re_${sent.length}` }), { status: 200 })
  }
})

after(() => {
  globalThis.fetch = realFetch
})

beforeEach(async () => {
  process.env.RESEND_API_KEY = 're_test_cle'
  resendStatus = 200
  sent.length = 0
  await db.query('delete from public.email_outbox')
})

/** Les abonnés tournent en arrière-plan : on attend que la file contienne ce qu'on espère */
async function waitForEmails(predicate, timeout = 3000) {
  const start = Date.now()
  for (;;) {
    const { rows } = await db.query('select * from public.email_outbox order by created_at')
    if (predicate(rows)) return rows
    if (Date.now() - start > timeout) return rows
    await new Promise((r) => setTimeout(r, 25))
  }
}

const checkout = (overrides = {}) =>
  orders.placeOrder(null, {
    customer: { name: 'Merveille Kabongo', phone: '+243810000000', email: 'merveille@exemple.com' },
    mode: 'livraison',
    address: { commune: 'Gombe', street: 'avenue de la Justice', landmark: 'portail bleu' },
    paymentMethod: 'mobile_money',
    provider: 'M-Pesa',
    payerPhone: '+243810000000',
    items: [{ variantId: box, quantity: 2 }],
    ...overrides,
  })

test('commande passée : confirmation au client et alerte à l’équipe, puis envoi par Resend', async () => {
  const o = await checkout()
  const rows = await waitForEmails((r) => r.length >= 2)
  const byKind = Object.fromEntries(rows.map((r) => [r.kind, r]))
  assert.equal(byKind.order_confirmation.to_email, 'merveille@exemple.com')
  assert.match(byKind.order_confirmation.subject, new RegExp(`${o.number} reçue`))
  assert.match(byKind.order_confirmation.html, /Petite boîte garnie Ounce/)
  assert.match(byKind.order_confirmation.html, new RegExp(`#suivi/${o.number}`))
  assert.equal(byKind.team_new_order.to_email, 'ecommerce@kennysinternational.com')
  assert.match(byKind.team_new_order.html, /\+243810000000/)

  const result = await notifications.processOutboxOnce()
  assert.equal(result.sent, 2)
  assert.equal(sent[0].from, 'kclick <commandes@notification.kclick-api.com>')
  assert.equal(sent[0].reply_to, 'ecommerce@kennysinternational.com')
  assert.equal(sent[0].auth, 'Bearer re_test_cle')
  const statuses = (await db.query('select status, provider_id from public.email_outbox')).rows
  assert.ok(statuses.every((r) => r.status === 'envoye' && r.provider_id))
})

test('les réglages sont respectés : confirmation client coupée, destinataires de l’équipe modifiés', async () => {
  await db.query(
    `update public.app_settings set value = jsonb_set(jsonb_set(value, '{customerEmails,confirmation}', 'false'), '{teamRecipients}', '["equipe@exemple.com", "Equipe@exemple.com"]')
      where key = 'notifications'`,
  )
  try {
    await checkout()
    const rows = await waitForEmails((r) => r.length >= 1)
    await new Promise((r) => setTimeout(r, 150))
    const all = (await db.query('select kind, to_email from public.email_outbox')).rows
    assert.deepEqual(all, [{ kind: 'team_new_order', to_email: 'equipe@exemple.com' }])
    assert.equal(rows.length, 1)
  } finally {
    await db.query(
      `update public.app_settings set value = jsonb_set(jsonb_set(value, '{customerEmails,confirmation}', 'true'), '{teamRecipients}', '["ecommerce@kennysinternational.com"]')
        where key = 'notifications'`,
    )
  }
})

test('commande sans e-mail client : seule l’équipe est prévenue', async () => {
  await checkout({ customer: { name: 'Sans Mail', phone: '+243820000000' } })
  await waitForEmails((r) => r.length >= 1)
  await new Promise((r) => setTimeout(r, 150))
  const kinds = (await db.query('select kind from public.email_outbox')).rows.map((r) => r.kind)
  assert.deepEqual(kinds, ['team_new_order'])
})

test('rupture d’une part : le client est prévenu (motif et commande refusée)', async () => {
  const o = await checkout()
  await waitForEmails((r) => r.length >= 2)
  const partId = (await db.query('select id from public.order_parts where order_id = $1', [o.id])).rows[0].id
  await parts.setStatus(employee, partId, { status: 'refusee', reason: 'Rupture de stock' })
  const rows = await waitForEmails((r) => r.some((x) => x.kind === 'part_refused'))
  const mail = rows.find((x) => x.kind === 'part_refused')
  assert.equal(mail.to_email, 'merveille@exemple.com')
  assert.match(mail.html, /Rupture de stock/)
  assert.match(mail.subject, /non préparée/)
})

test('le nom du client est échappé dans le HTML', async () => {
  await checkout({ customer: { name: '<script>alert(1)</script> Kabongo', phone: '+243830000000', email: 'x@exemple.com' } })
  const rows = await waitForEmails((r) => r.length >= 2)
  for (const r of rows) {
    assert.ok(!r.html.includes('<script>'), r.kind)
    assert.ok(r.html.includes('&lt;script&gt;'), r.kind)
  }
})

test('sans clé Resend : rien n’est envoyé, l’e-mail est marqué « ignore »', async () => {
  delete process.env.RESEND_API_KEY
  await checkout()
  await waitForEmails((r) => r.length >= 2)
  const result = await notifications.processOutboxOnce()
  assert.equal(result.ignored, 2)
  assert.equal(sent.length, 0)
  const statuses = (await db.query('select distinct status from public.email_outbox')).rows.map((r) => r.status)
  assert.deepEqual(statuses, ['ignore'])

  // Renvoi par le super admin une fois la clé ajoutée
  process.env.RESEND_API_KEY = 're_test_cle'
  const id = (await db.query('select id from public.email_outbox limit 1')).rows[0].id
  await notifications.retryEmail(id)
  assert.equal((await notifications.processOutboxOnce()).sent, 1)
})

test('Resend en panne : nouveaux essais espacés, puis « echec » après 4 essais', async () => {
  const id = (
    await db.query(`insert into public.email_outbox (kind, to_email, subject, html) values ('test', 'a@exemple.com', 'Test', '<p>t</p>') returning id`)
  ).rows[0].id
  resendStatus = 503
  for (let attempt = 1; attempt <= notifications.MAX_ATTEMPTS; attempt++) {
    await db.query('update public.email_outbox set next_attempt_at = now() where id = $1', [id])
    await notifications.processOutboxOnce()
    const row = (await db.query('select status, attempts, next_attempt_at > now() as later from public.email_outbox where id = $1', [id])).rows[0]
    assert.equal(row.attempts, attempt)
    if (attempt < notifications.MAX_ATTEMPTS) {
      assert.equal(row.status, 'en_attente')
      assert.equal(row.later, true)
    } else assert.equal(row.status, 'echec')
  }
})

test('adresse refusée par Resend (4xx) : pas de nouvel essai', async () => {
  await db.query(`insert into public.email_outbox (kind, to_email, subject, html) values ('test', 'bad', 'Test', '<p>t</p>')`)
  resendStatus = 422
  await notifications.processOutboxOnce()
  const row = (await db.query('select status, attempts, last_error from public.email_outbox')).rows[0]
  assert.equal(row.status, 'echec')
  assert.equal(row.attempts, 1)
  assert.match(row.last_error, /422/)
})

test('invitation d’un membre de l’équipe : e-mail « Votre accès à kclick », renvoi possible', async () => {
  const invited = await users.invite(admin, { firstName: 'Ruth', lastName: 'Mbala', email: 'ruth@exemple.com', role: 'employe', brand: 'patchi' })
  const rows = await waitForEmails((r) => r.some((x) => x.kind === 'invitation'))
  const mail = rows.find((x) => x.kind === 'invitation')
  assert.equal(mail.to_email, 'ruth@exemple.com')
  assert.equal(mail.subject, 'Votre accès à kclick')
  assert.match(mail.html, /Maison Patchi/)
  assert.match(mail.html, /#connexion/)

  const resent = await users.resendInvitation(invited.id)
  assert.equal(resent.sent, true)
  await waitForEmails((r) => r.filter((x) => x.kind === 'invitation').length >= 2)

  delete process.env.RESEND_API_KEY
  const offline = await users.resendInvitation(invited.id)
  assert.equal(offline.sent, false)
})

test('liste des e-mails pour le super admin (sans le HTML)', async () => {
  await checkout()
  await waitForEmails((r) => r.length >= 2)
  const list = await notifications.listEmails({ limit: 10 })
  assert.equal(list.length, 2)
  assert.ok(list[0].order_number)
  assert.equal(list[0].html, undefined)
  await assert.rejects(notifications.retryEmail(list[0].id), { code: 'EMAIL_NOT_RETRYABLE' })
})
