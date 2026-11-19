import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canMovePart, computeOrderState, customerCanCancel, tabOf } from '../../src/modules/orders/orders.status.js'

const order = { status: 'en_cours', mode: 'livraison', delivery_fee: 4, is_partial: false }

test('une part ne peut pas sauter d’étape', () => {
  assert.equal(canMovePart('en_attente', 'acceptee'), true)
  assert.equal(canMovePart('en_attente', 'prete'), false)
  assert.equal(canMovePart('refusee', 'acceptee'), false)
})

test('une brand refuse : la commande continue, partielle, total recalculé', () => {
  const state = computeOrderState(order, [
    { status: 'prete', amount_due: 93 },
    { status: 'refusee', amount_due: 48 },
  ])
  assert.deepEqual(state, { status: 'en_cours', isPartial: true, adjustedTotal: 97 })
})

test('toutes les brands refusent : commande refusée, total 0', () => {
  const state = computeOrderState({ ...order, status: 'en_attente' }, [
    { status: 'refusee', amount_due: 93 },
    { status: 'refusee', amount_due: 48 },
  ])
  assert.deepEqual(state, { status: 'refusee', isPartial: false, adjustedTotal: 0 })
})

test('toutes les parts collectées en livraison : en_livraison', () => {
  const state = computeOrderState(order, [{ status: 'collectee', amount_due: 10.1 }, { status: 'collectee', amount_due: 20.2 }])
  assert.equal(state.status, 'en_livraison')
  assert.equal(state.adjustedTotal, 34.3)
})

test('onglets des dashboards', () => {
  assert.equal(tabOf('en_livraison'), 'En cours')
  assert.equal(tabOf('annulee'), 'Refusées')
  assert.equal(tabOf('retiree'), 'Terminées')
})

test('le client peut annuler une commande partielle avant la livraison', () => {
  assert.equal(customerCanCancel({ status: 'en_cours', is_partial: true }), true)
  assert.equal(customerCanCancel({ status: 'en_cours', is_partial: false }), false)
  assert.equal(customerCanCancel({ status: 'en_livraison', is_partial: true }), false)
})
