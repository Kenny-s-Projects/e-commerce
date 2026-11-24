import * as maishapay from './maishapay.js'

/*
 * Mobile money (M-Pesa, Orange Money, Airtel Money, Afrimoney) par MaishaPay.
 * start  : envoie la demande de validation sur le téléphone du client (réponse PENDING)
 * verify : état réel de la transaction (jamais le message reçu tel quel)
 * refund : remboursement fait à la main par l'équipe pour l'instant (dashboard › Paiements)
 */
export const isEnabled = maishapay.isEnabled

export async function start({ order, payment }) {
  return maishapay.collectMobileMoney({
    reference: payment.reference,
    amount: payment.amount,
    currency: payment.currency ?? 'USD',
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    provider: payment.provider,
    phone: payment.payer_phone ?? order.customer_phone,
  })
}

export const verify = (payment) => maishapay.lookup({ providerTxId: payment.provider_tx_id, reference: payment.reference })

export async function refund() {
  return null // remboursement manuel (B2C MaishaPay à brancher plus tard)
}
