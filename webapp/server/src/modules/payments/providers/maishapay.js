import { env } from '../../../config/env.js'
import { logger } from '../../../config/logger.js'
import { AppError } from '../../../shared/errors.js'

const config = {
  publicKey: env.MAISHAPAY_PUBLIC_KEY,
  secretKey: env.MAISHAPAY_SECRET_KEY,
  mode: env.MAISHAPAY_MODE, // '0' test, '1' réel
  apiUrl: env.MAISHAPAY_API_URL,
  publicApiUrl: env.API_PUBLIC_URL,
  fetch: (...args) => globalThis.fetch(...args),
  timeoutMs: 30_000,
}

/** Tests : remplace l'accès réseau et les réglages (jamais utilisé en production) */
export function configure(overrides) {
  Object.assign(config, overrides)
}

/** MaishaPay est branché : les deux clés et l'adresse publique de l'API sont connues */
export const isEnabled = () => Boolean(config.publicKey && config.secretKey && config.publicApiUrl)
export const isLive = () => config.mode === '1'

/** Adresse où MaishaPay envoie le résultat (mobile money : POST ; carte : GET, le client y revient) */
export const callbackUrl = () => `${config.publicApiUrl}/api/v1/payments/webhooks/maishapay`

// Nos libellés d'opérateurs (Paramètres › Paiements) → codes MaishaPay
const PROVIDERS = {
  'm-pesa': 'MPESA',
  mpesa: 'MPESA',
  'orange money': 'ORANGE',
  orange: 'ORANGE',
  'airtel money': 'AIRTEL',
  airtel: 'AIRTEL',
  afrimoney: 'AFRIMONEY',
  'afri money': 'AFRIMONEY',
}
export const providerCode = (label) => PROVIDERS[String(label ?? '').trim().toLowerCase()] ?? null

/** Téléphone au format attendu par MaishaPay : +243xxxxxxxxx (sans espaces) */
export function walletId(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('243')) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 10) return `+243${digits.slice(1)}`
  if (digits.length === 9) return `+243${digits}`
  return `+${digits}`
}

/**
 * Statut MaishaPay → statut kclick : 'paye' | 'echoue' | 'en_attente'.
 * (La doc montre « PENDING » avec une espace en trop : on nettoie.)
 */
export function normalizeStatus(raw) {
  const s = String(raw ?? '').trim().toUpperCase()
  if (['SUCCESS', 'SUCCESSFUL', 'APPROVED', 'COMPLETED', 'PAID'].includes(s)) return 'paye'
  if (['FAILED', 'FAILURE', 'DECLINED', 'CANCELED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'ERROR'].includes(s)) return 'echoue'
  return 'en_attente'
}

const keys = () => ({ gatewayMode: Number(config.mode), publicApiKey: config.publicKey, secretApiKey: config.secretKey })

/** Copie d'un message sans les clés (pour le journal des paiements) */
export function redact(body) {
  if (!body || typeof body !== 'object') return body ?? null
  const { publicApiKey: _p, secretApiKey: _s, ...rest } = body
  return rest
}

const unavailable = (message) => new AppError(502, 'PAYMENT_PROVIDER_ERROR', message)

async function call(path, body, { timeoutMs = config.timeoutMs } = {}) {
  if (!isEnabled()) throw new AppError(503, 'PAYMENT_PROVIDER_OFF', 'Le paiement en ligne n’est pas encore activé')
  let res
  try {
    res = await config.fetch(`${config.apiUrl}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...keys(), ...body }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    logger.warn({ path, err: err.name }, 'MaishaPay injoignable')
    throw unavailable('Le service de paiement ne répond pas. Réessayez dans un instant.')
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  // 202 : paiement lancé ; 200 : vérification ; 400 : refus (corps quand même renvoyé avec un statut lisible)
  if (!data) {
    logger.warn({ path, status: res.status }, 'Réponse MaishaPay illisible')
    throw unavailable('Le service de paiement a renvoyé une réponse inattendue. Réessayez dans un instant.')
  }
  return { httpStatus: res.status, data: data.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : data }
}

// Lecture d'une réponse MaishaPay (champs communs à la collecte et à la vérification).
// Réponse sans statut de transaction (champ manquant, clé invalide, transaction inconnue…) :
//  - à la demande de paiement → refusée (échec) ;
//  - à la vérification → on ne conclut rien, le paiement reste en attente.
function readResult(httpStatus, d, { missing = 'echoue' } = {}) {
  const raw = d.transactionStatus ?? d.status ?? d.description
  const rejected = !raw && httpStatus >= 400
  return {
    status: rejected ? missing : normalizeStatus(raw),
    rawStatus: rejected ? `HTTP ${httpStatus}` : String(raw ?? '').trim(),
    providerTxId: d.transactionId != null ? String(d.transactionId) : null,
    reference: d.originatingTransactionId ?? d.transactionReference ?? null,
    fees: Number.isFinite(Number(d.order?.cost?.frais ?? d.cost?.frais)) ? Number(d.order?.cost?.frais ?? d.cost?.frais) : null,
    paymentPage: d.paymentPage ?? null,
    message: rejected ? String(d.message ?? d.error ?? 'Demande refusée par le service de paiement') : (d.transactionDescription ?? null),
    payload: d,
  }
}

/** Mobile money : demande de validation envoyée sur le téléphone du client */
export async function collectMobileMoney({ reference, amount, currency = 'USD', customerName, customerEmail, provider, phone }) {
  const code = providerCode(provider)
  if (!code) throw new AppError(400, 'UNKNOWN_OPERATOR', `Opérateur mobile money inconnu : ${provider}`)
  const request = {
    transactionReference: reference,
    order: { amount: String(amount), currency, customerFullName: customerName ?? '', customerEmailAdress: customerEmail ?? '' },
    paymentChannel: { channel: 'MOBILEMONEY', provider: code, walletID: walletId(phone), callbackUrl: callbackUrl() },
  }
  const { httpStatus, data } = await call('/collect/v2/store/mobileMoney', request)
  return { request, ...readResult(httpStatus, data) }
}

/** Carte : MaishaPay renvoie la page de paiement sécurisée (CyberSource) où envoyer le client */
export async function collectCard({ reference, amount, currency = 'USD', firstname, lastname, address, city = 'Kinshasa', phone, email, provider = 'VISA' }) {
  const request = {
    transactionReference: reference,
    order: {
      amount: String(amount),
      currency,
      customerFirstname: firstname || 'Client',
      customerLastname: lastname || firstname || 'kclick',
      customerAddress: address || 'Gombe',
      customerCity: city,
      customerPhoneNumber: walletId(phone),
      customerEmailAdress: email,
    },
    paymentChannel: { channel: 'CARD', provider, callbackUrl: callbackUrl() },
  }
  const { httpStatus, data } = await call('/collect/v3/store/card', request)
  return { request, ...readResult(httpStatus, data) }
}

/** État réel d'une transaction : par son numéro MaishaPay, sinon par notre référence */
export async function lookup({ providerTxId, reference }) {
  const byRef = !providerTxId
  const { httpStatus, data } = await call(`/transaction/rest/v2/check${byRef ? '?useRef=1' : ''}`, { transactionId: providerTxId ?? reference })
  return readResult(httpStatus, data, { missing: 'en_attente' })
}
