import { isConfigured, sendCode, verifyCode } from '../../lib/supabase.js'
import { api } from '../../lib/api.js'

/*
 * Connexion des clients par code à 6 chiffres reçu par e-mail (Supabase Auth).
 * Le mode (connexion ou inscription) et les infos d'inscription sont gardés le temps de saisir le code.
 */
const PENDING_KEY = 'kclick-login-pending'

export const authAvailable = () => isConfigured

export function savePending(pending) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    /* stockage indisponible */
  }
}
export function readPending() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? 'null')
  } catch {
    return null
  }
}

/** Envoie (ou renvoie) le code. Inscription : le compte est créé ; connexion : seulement s'il existe. */
export function requestCode({ email, mode = 'login', fullName, phone }) {
  return sendCode(email, { createUser: mode === 'signup', fullName, phone })
}

/** Vérifie le code puis renvoie l'adresse où aller (#compte/profil, ou l'espace de l'équipe) */
export async function confirmCode(email, code) {
  await verifyCode(email, code)
  const pending = readPending()
  // Inscription : nom et téléphone enregistrés dans le profil
  if (pending?.mode === 'signup' && (pending.fullName || pending.phone || pending.lang)) {
    await api.patch('/users/me', { fullName: pending.fullName, phone: pending.phone, lang: pending.lang }).catch(() => {})
  }
  const me = await api.get('/auth/me')
  return me?.home && me.home !== '#compte/profil' ? me.home : '#compte/profil'
}

/** Messages d'erreur Supabase / API en français */
export function authMessage(err) {
  const text = `${err?.code ?? ''} ${err?.message ?? ''}`.toLowerCase()
  if (!isConfigured) return 'La connexion n’est pas encore configurée sur ce site (VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY).'
  if (text.includes('signups not allowed') || text.includes('otp_disabled') || text.includes('user not found'))
    return 'Aucun compte avec cette adresse. Créez un compte pour continuer.'
  if (text.includes('expired') || text.includes('invalid') || text.includes('otp'))
    return 'Code incorrect ou expiré. Vérifiez les 6 chiffres ou demandez un nouveau code.'
  if (text.includes('rate') || err?.status === 429) return 'Trop de tentatives. Patientez une minute avant de réessayer.'
  if (text.includes('network') || text.includes('fetch')) return 'Connexion impossible. Vérifiez votre connexion internet.'
  return err?.message || 'Une erreur est survenue. Réessayez.'
}
