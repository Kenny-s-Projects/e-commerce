import * as maishapay from './maishapay.js'

/*
 * Carte (Visa, Mastercard) par MaishaPay : le client est envoyé sur la page de paiement sécurisée
 * (CyberSource, de Visa). Aucun numéro de carte ne passe par kclick.
 * start  : crée la transaction et renvoie paymentPage (où rediriger le client)
 * verify : état réel de la transaction
 * refund : remboursement fait à la main par l'équipe pour l'instant
 */
export const isEnabled = maishapay.isEnabled

export async function start({ order, payment }) {
  const [firstname, ...rest] = String(order.customer_name ?? '').trim().split(/\s+/)
  const address = order.address_snapshot ?? {}
  return maishapay.collectCard({
    reference: payment.reference,
    amount: payment.amount,
    currency: payment.currency ?? 'USD',
    firstname,
    lastname: rest.join(' '),
    address: [address.street, address.quartier].filter(Boolean).join(', ') || null,
    city: 'Kinshasa',
    phone: order.customer_phone,
    email: order.customer_email,
    provider: 'VISA', // la page CyberSource accepte aussi Mastercard
  })
}

export const verify = (payment) => maishapay.lookup({ providerTxId: payment.provider_tx_id, reference: payment.reference })

export async function refund() {
  return null // remboursement manuel pour l'instant
}
