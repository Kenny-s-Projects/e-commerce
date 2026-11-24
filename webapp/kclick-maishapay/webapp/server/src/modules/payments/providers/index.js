// Chaque moyen de paiement respecte la même interface :
//   isEnabled()               → le prestataire est branché (clés présentes)
//   start({ order, payment }) → démarre le paiement ; renvoie { status, providerTxId, fees, paymentPage, rawStatus, message, request, payload }
//   verify(payment)           → état réel du paiement chez le prestataire (même forme)
//   refund({ payment, amount })
// Prestataire actuel : MaishaPay (maishapay.js). Changer de prestataire = remplacer ces fichiers.
// Pas de paiement à la livraison.
import * as mobileMoney from './mobileMoney.js'
import * as card from './card.js'

export const providers = { mobile_money: mobileMoney, carte: card }
export { configure as configureMaishaPay } from './maishapay.js'
