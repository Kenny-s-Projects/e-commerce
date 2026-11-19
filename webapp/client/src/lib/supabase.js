import { createClient } from '@supabase/supabase-js'

/*
 * Supabase côté navigateur : UNIQUEMENT pour la connexion (code à 6 chiffres reçu par e-mail).
 * Toutes les données passent par l'API Express (voir lib/api.js).
 * La clé publiable est faite pour être dans le navigateur ; la clé serveur (service_role) ne doit JAMAIS y être.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null

const notConfigured = () => {
  throw new Error('Connexion indisponible : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY manquent (voir .env.example)')
}

/** Envoie un code à 6 chiffres par e-mail. createUser = false pour l'équipe (comptes créés par invitation). */
export async function sendCode(email, { createUser = true, fullName, phone } = {}) {
  if (!supabase) notConfigured()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: createUser, data: fullName || phone ? { full_name: fullName, phone } : undefined },
  })
  if (error) throw error
}

/** Vérifie le code reçu ; ouvre la session */
export async function verifyCode(email, token) {
  if (!supabase) notConfigured()
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' })
  if (error) throw error
  return data.session
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}

export async function getAccessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/** Suit la session (connexion, déconnexion, rafraîchissement) */
export function onSessionChange(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
