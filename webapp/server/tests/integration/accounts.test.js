// Comptes de l'équipe, connexion, clients, paramètres, Maisons (sur la base PostgreSQL en mémoire)
import '../jwt-secret.js'
import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { SignJWT } from 'jose'
import { createTestDatabase } from '../db.js'


const { createApp } = await import('../../src/app.js')
const { loadUser } = await import('../../src/middlewares/auth.js')
const users = await import('../../src/modules/users/users.service.js')
const auth = await import('../../src/modules/auth/auth.service.js')
const clients = await import('../../src/modules/clients/clients.service.js')
const settings = await import('../../src/modules/settings/settings.service.js')
const brands = await import('../../src/modules/brands/brands.service.js')
const app = createApp()
let db

/** Simule la première connexion Supabase : une ligne dans auth.users (le trigger crée profil et rôles) */
async function signUp(email, name = 'Test') {
  const { rows } = await db.query(
    `insert into auth.users (email, raw_user_meta_data) values ($1, jsonb_build_object('full_name', $2::text)) returning id`,
    [email, name],
  )
  return loadUser(rows[0].id)
}

const token = (user) =>
  new SignJWT({ email: user.email, role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(`${process.env.SUPABASE_URL}/auth/v1`)
    .setAudience('authenticated')
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET))

let admin

before(async () => {
  db = await createTestDatabase()
  admin = await signUp('ecommerce@kennysinternational.com', 'Kenny’s International') // invitation de départ (migration)
})

test('le super admin de départ reçoit son rôle à la première connexion', async () => {
  assert.equal(admin.has('super_admin'), true)
  assert.equal(admin.has('client'), true)
  const me = await auth.me(admin)
  assert.equal(me.home, '#admin')
})

test('espace équipe : invitation acceptée, inconnu refusé, compte désactivé refusé', async () => {
  assert.deepEqual(await auth.checkStaff('ecommerce@kennysinternational.com'), { allowed: true, role: 'super_admin', invited: false })
  await assert.rejects(auth.checkStaff('inconnu@exemple.com'), { code: 'NOT_STAFF', status: 404 })

  await users.invite(admin, { firstName: 'Esther', lastName: 'Kanza', email: 'esther@exemple.com', role: 'employe', brand: 'patchi' })
  assert.deepEqual(await auth.checkStaff('esther@exemple.com'), { allowed: true, role: 'employe', invited: true })

  const esther = await signUp('esther@exemple.com')
  assert.equal(esther.has('employe'), true)
  assert.equal((await auth.me(esther)).home, '#employe/patchi')
  await users.setActive(admin, esther.id, false)
  await assert.rejects(auth.checkStaff('esther@exemple.com'), { code: 'ACCOUNT_DISABLED' })
})

test('jeton valide mais compte désactivé : 403 ACCOUNT_DISABLED ; /auth/me renvoie la page d’arrivée', async () => {
  await users.invite(admin, { firstName: 'Glody', lastName: 'Kabeya', email: 'glody@exemple.com', role: 'livreur', vehicle: 'Moto', zone: 'Gombe' })
  const glody = await signUp('glody@exemple.com')
  const t = await token(glody)

  const ok = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${t}`)
  assert.equal(ok.status, 200, JSON.stringify(ok.body))
  assert.equal(ok.body.home, '#livreur')
  const { rows } = await db.query('select vehicle, zone from public.riders where profile_id = $1', [glody.id])
  assert.deepEqual(rows[0], { vehicle: 'Moto', zone: 'Gombe' })

  await users.setActive(admin, glody.id, false)
  const ko = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${t}`)
  assert.equal(ko.status, 403)
  assert.equal(ko.body.error.code, 'ACCOUNT_DISABLED')
  await users.setActive(admin, glody.id, true)
})

test('routes réservées : un employé ne peut pas lister les utilisateurs', async () => {
  await users.invite(admin, { firstName: 'Aline', lastName: 'Mukendi', email: 'aline@exemple.com', role: 'employe', brand: 'kyra' })
  const aline = await signUp('aline@exemple.com')
  const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${await token(aline)}`)
  assert.equal(res.status, 403)
  const ok = await request(app).get('/api/v1/users?role=employe').set('Authorization', `Bearer ${await token(admin)}`)
  assert.equal(ok.status, 200)
  assert.ok(ok.body.every((u) => u.role === 'employe'))
})

test('inviter : e-mail en double refusé, Maison obligatoire, client existant promu tout de suite', async () => {
  await users.invite(admin, { firstName: 'Junior', lastName: 'Lokwa', email: 'junior@exemple.com', role: 'employe', brand: 'adidas' })
  await assert.rejects(users.invite(admin, { firstName: 'J', lastName: 'L', email: 'junior@exemple.com', role: 'livreur' }), { code: 'ALREADY_INVITED' })
  await assert.rejects(users.invite(admin, { firstName: 'X', lastName: 'Y', email: 'x@exemple.com', role: 'employe', brand: 'inconnue' }), { code: 'UNKNOWN_BRAND' })

  const res = await request(app)
    .post('/api/v1/users/invitations')
    .set('Authorization', `Bearer ${await token(admin)}`)
    .send({ firstName: 'Ruth', lastName: 'Mbala', email: 'ruth@exemple.com', role: 'employe' })
  assert.equal(res.status, 400)
  assert.ok(res.body.error.details.some((d) => d.field === 'brand'))

  const client = await signUp('client.fidele@exemple.com', 'Client Fidèle')
  const promoted = await users.invite(admin, { firstName: 'Client', lastName: 'Fidèle', email: 'client.fidele@exemple.com', role: 'livreur' })
  assert.equal(promoted.kind, 'user')
  assert.equal(promoted.id, client.id)
  assert.equal(promoted.status, 'actif')

  const list = await users.list({ status: 'invite' })
  assert.ok(list.some((u) => u.email === 'junior@exemple.com' && u.brand === 'adidas'))
})

test('modifier et retirer une invitation, renvoi sans e-mail branché', async () => {
  const inv = await users.invite(admin, { firstName: 'Paul', lastName: 'Ngoy', email: 'paul@exemple.com', role: 'livreur' })
  const updated = await users.update(admin, inv.id, { role: 'employe', brand: 'celio', firstName: 'Paul-Henri' })
  assert.equal(updated.role, 'employe')
  assert.equal(updated.brand, 'celio')
  assert.equal(updated.firstName, 'Paul-Henri')
  assert.deepEqual(await users.resendInvitation(inv.id), { id: inv.id, sent: false, reason: 'Service d’e-mails non configuré (RESEND_API_KEY)' })
  await users.revokeInvitation(inv.id)
  await assert.rejects(auth.checkStaff('paul@exemple.com'), { code: 'NOT_STAFF' })
})

test('changer le rôle d’un membre garde le rôle client ; protections du super admin', async () => {
  const esther = (await users.list({ search: 'esther' }))[0]
  await users.setActive(admin, esther.id, true)
  const changed = await users.update(admin, esther.id, { role: 'livreur', zone: 'Ngaliema' })
  assert.equal(changed.role, 'livreur')
  assert.equal(changed.zone, 'Ngaliema')
  const { rows } = await db.query('select role from public.user_roles where user_id = $1 order by role', [esther.id])
  assert.deepEqual(rows.map((r) => r.role), ['client', 'livreur'])

  await assert.rejects(users.setActive(admin, admin.id, false), { code: 'FORBIDDEN' })
  await assert.rejects(users.update(admin, admin.id, { role: 'livreur' }), { code: 'FORBIDDEN' })
})

test('clients : commandes sans compte regroupées par téléphone, rattachées au compte qui a ce numéro', async () => {
  const merveille = await signUp('merveille@exemple.com', 'Merveille Kabongo')
  await db.query(`update public.profiles set phone = '+243 81 000 00 00' where id = $1`, [merveille.id])
  const order = (number, phone, name, status, total, customerId = null) =>
    db.query(
      `insert into public.orders (number, customer_id, customer_name, customer_phone, mode, payment_method, status, total, adjusted_total)
       values ($1, $2, $3, $4, 'retrait', 'mobile_money', $5, $6, $6)`,
      [number, customerId, name, phone, status, total],
    )
  await order('KC-90001', '+243810000000', 'Merveille K.', 'livree', 97)
  await order('KC-90002', '+243 81 000 00 00', 'Merveille Kabongo', 'en_cours', 48, merveille.id)
  await order('KC-90003', '+243 99 111 22 33', 'Daniel Mutombo', 'livree', 119)
  await order('KC-90004', '0991112233', 'Daniel M.', 'annulee', 50)
  await order('KC-90005', '+243991112233', 'Daniel Mutombo', 'livree', 20)

  const all = await clients.list({})
  const m = all.find((c) => c.key === merveille.id)
  assert.equal(m.ordersCount, 2)
  assert.equal(m.totalSpent, 145)
  assert.equal(m.hasAccount, true)

  // +243 99 111 22 33 et +243991112233 : même client ; 0991112233 (format local) reste un client distinct
  const guests = await clients.list({ filter: 'guest', search: '99111' })
  assert.equal(guests.length, 2)
  const daniel = guests.find((c) => c.ordersCount === 2)
  assert.equal(daniel.totalSpent, 139)

  const detail = await clients.get(merveille.id)
  assert.deepEqual(detail.orders.map((o) => o.number).sort(), ['KC-90001', 'KC-90002'])
  await assert.rejects(clients.get('tel-000'), { code: 'NOT_FOUND' })
})

test('paramètres : valeurs par défaut, validation, paiement à la livraison toujours désactivé', async () => {
  const all = await settings.getAll()
  assert.equal(all.general.supportEmail, 'ecommerce@kennysinternational.com')
  assert.equal(all.delivery.zones[0].fee, 4)

  const saved = await settings.update(admin, 'payments', { ...all.payments, cashOnDelivery: true, provider: 'À choisir' })
  assert.equal(saved.cashOnDelivery, false)
  await assert.rejects(
    settings.update(admin, 'payments', { ...all.payments, mobileMoney: { ...all.payments.mobileMoney, enabled: false }, card: { enabled: false } }),
    { code: 'VALIDATION_FAILED' },
  )
  await assert.rejects(settings.update(admin, 'delivery', { ...all.delivery, sameDayCutoff: '25:00' }), { code: 'VALIDATION_FAILED' })

  const pub = await request(app).get('/api/v1/settings/public')
  assert.equal(pub.status, 200)
  assert.deepEqual(pub.body.delivery.zones, [{ commune: 'Gombe', fee: 4, delay: 'Le jour même' }])
  assert.deepEqual(pub.body.payments.mobileMoney, ['M-Pesa', 'Orange Money', 'Airtel Money'])
  assert.equal((await request(app).get('/api/v1/settings')).status, 401)
})

test('Maisons : Patchi ouverte, les autres « bientôt disponibles », réglable par le super admin', async () => {
  const list = await brands.list()
  assert.deepEqual(Object.fromEntries(list.map((b) => [b.slug, b.is_open])), { kyra: false, patchi: true, adidas: false, celio: false })
  const res = await request(app).patch('/api/v1/brands/kyra').set('Authorization', `Bearer ${await token(admin)}`).send({ isOpen: true })
  assert.equal(res.status, 200)
  assert.equal(res.body.is_open, true)
  assert.equal((await request(app).get('/api/v1/brands/kyra')).body.is_open, true)

  const hours = await brands.updateHours(admin, 'patchi', [{ weekday: 1, opensAt: '09:00', closesAt: '19:00', lastOrderAt: '17:00' }])
  assert.deepEqual(hours, [{ weekday: 1, opens_at: '09:00', closes_at: '19:00', last_order_at: '17:00' }])
})
