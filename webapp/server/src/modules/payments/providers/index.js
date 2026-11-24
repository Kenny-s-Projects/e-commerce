// Chaque moyen de paiement respecte la même interface :
//   start({ order, payment })  → démarre le paiement (ex. demande de validation sur le téléphone)
//   verify(webhookRequest)     → confirme ou refuse le paiement à partir du message du prestataire
//   refund({ payment, amount })
// Changer de prestataire = remplacer un seul fichier de ce dossier.
// Pas de paiement à la livraison.
import * as mobileMoney from './mobileMoney.js'
import * as card from './card.js'

export const providers = { mobile_money: mobileMoney, carte: card }
export { configure as configureMaishaPay } from './maishapay.js'
