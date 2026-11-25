import { api } from './api.js'

/*
 * Paiement en ligne (MaishaPay) côté site : lancer, relancer, suivre.
 * Accès comme le suivi sans compte : numéro de commande + téléphone de la commande.
 * Les clés MaishaPay restent sur le serveur : le site ne parle jamais directement à MaishaPay.
 */

/** Lance (ou relance) le paiement ; autre opérateur / autre numéro mobile money possibles pour réessayer */
export const startPayment = (number, phone, { provider, payerPhone } = {}) =>
  api.post('/payments/start', { number, phone, provider: provider || undefined, payerPhone: payerPhone || undefined }, { auth: false })

/** Où en est le paiement ? { status: a_payer | en_attente | paye | echoue, waiting, paymentPage, failureReason, canRetry, online… } */
export const paymentStatus = (number, phone) => api.get(`/payments/status/${encodeURIComponent(number)}`, { phone }, { auth: false })

/** Carte : envoie le client sur la page de paiement sécurisée de MaishaPay (CyberSource, Visa) */
export function goToCardPage(url) {
  if (url && /^https:\/\//.test(url)) window.location.assign(url)
}
