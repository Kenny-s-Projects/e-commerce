/*
 * Supabase côté navigateur : UNIQUEMENT pour la connexion (code à 6 chiffres reçu par e-mail).
 * Toutes les données passent par l'API Express (voir lib/api.js).
 * La clé publiable est faite pour être dans le navigateur ; la clé serveur (service_role) ne doit JAMAIS y être.
 *
 * Performance : la bibliothèque supabase-js (lourde) n'est chargée qu'au moment où on en a besoin
 * (connexion, ou visiteur déjà connecté). Un visiteur sans session ne la télécharge jamais.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** La connexion est-elle configurée sur ce site ? */
export const isConfigured = Boolean(url && key)

// Clé sous laquelle supabase-js garde la session (sb-<ref>-auth-token)
const STORAGE_KEY = (() => {
  try {
    return url ? `sb-${new URL(url).hostname.split('.')[0]}-auth-token` : null
  } catch {
    return null
  }
})()

const hasStoredSession = () => {
  try {
    return Boolean(STORAGE_KEY && localStorage.getItem(STORAGE_KEY))
  } catch {
    return false
  }
}

/** Une session est-elle gardée sur cet appareil ? (lecture du stockage seulement : supabase-js n'est pas chargé) */
export const hasSession = () => hasStoredSession()

let clientPromise = null
function getClient() {
  if (!isConfigured) return Promise.resolve(null)
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }),
  )
  return clientPromise
}

const notConfigured = () => {
  throw new Error('Connexion indisponible : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY manquent (voir .env.example)')
}

/** Envoie un code à 6 chiffres par e-mail. createUser = false pour l'équipe (comptes créés par invitation). */
export async function sendCode(email, { createUser = true, fullName, phone } = {}) {
  const supabase = await getClient()
  if (!supabase) notConfigured()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: createUser, data: fullName || phone ? { full_name: fullName, phone } : undefined },
  })
  if (error) throw error
}

/** Vérifie le code reçu ; ouvre la session */
export async function verifyCode(email, token) {
  const supabase = await getClient()
  if (!supabase) notConfigured()
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' })
  if (error) throw error
  return data.session
}

export async function signOut() {
  if (!hasStoredSession() && !clientPromise) return
  const supabase = await getClient()
  if (supabase) await supabase.auth.signOut()
}

/** Jeton de la session en cours, ou null (sans charger supabase-js si personne n'est connecté) */
export async function getAccessToken() {
  if (!hasStoredSession() && !clientPromise) return null
  const supabase = await getClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/** Suit la session (connexion, déconnexion, rafraîchissement). Renvoie la fonction pour arrêter le suivi. */
export function onSessionChange(callback) {
  let unsubscribe = null
  let stopped = false
  getClient().then((supabase) => {
    if (!supabase || stopped) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
    unsubscribe = () => data.subscription.unsubscribe()
  })
  return () => {
    stopped = true
    unsubscribe?.()
  }
}
