/*
 * Numéros de téléphone : indicatif pays + numéro national.
 * On envoie toujours « +<indicatif> <chiffres> » (ex. « +243 812345678 ») à l'API.
 * Le suivi d'une commande compare les 9 derniers chiffres : le format reste compatible.
 */

export const DEFAULT_CODE = '243'

// Indicatifs proposés (RDC par défaut, puis pays voisins, puis diaspora). name : texte français traduit par t()
export const COUNTRIES = [
  { code: '243', flag: '🇨🇩', name: 'RDC' },
  { code: '242', flag: '🇨🇬', name: 'Congo' },
  { code: '244', flag: '🇦🇴', name: 'Angola' },
  { code: '250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '257', flag: '🇧🇮', name: 'Burundi' },
  { code: '255', flag: '🇹🇿', name: 'Tanzanie' },
  { code: '256', flag: '🇺🇬', name: 'Ouganda' },
  { code: '260', flag: '🇿🇲', name: 'Zambie' },
  { code: '27', flag: '🇿🇦', name: 'Afrique du Sud' },
  { code: '33', flag: '🇫🇷', name: 'France' },
  { code: '32', flag: '🇧🇪', name: 'Belgique' },
  { code: '1', flag: '🇺🇸', name: 'États-Unis/Canada' },
  { code: '44', flag: '🇬🇧', name: 'Royaume-Uni' },
]

export const countryOf = (code) => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]

// Indicatifs les plus longs d'abord (« 243 » avant « 24… », « 27 » avant « 2 »)
const BY_LENGTH = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length)

/** Chiffres du numéro national, sans le 0 de tête (« 0812 345 678 » → « 812345678 ») */
export const nationalDigits = (value) => String(value ?? '').replace(/\D/g, '').replace(/^0+/, '')

/**
 * Découpe un numéro complet (profil, saisie collée) : « +243 812345678 », « +243812345678 », « 00243… »
 * → { code: '243', number: '812345678' }. Sans indicatif reconnu : RDC par défaut.
 */
export function splitPhone(raw, fallbackCode = DEFAULT_CODE) {
  const text = String(raw ?? '').trim()
  if (!text) return { code: fallbackCode, number: '' }
  const international = /^(\+|00)/.test(text)
  const digits = text.replace(/\D/g, '').replace(/^00/, '')
  if (international) {
    const country = BY_LENGTH.find((c) => digits.startsWith(c.code))
    if (country) return { code: country.code, number: nationalDigits(digits.slice(country.code.length)) }
  }
  // « 243812345678 » sans « + » : l'indicatif RDC est reconnu aussi
  if (!international && digits.length === 12 && digits.startsWith(DEFAULT_CODE)) return { code: DEFAULT_CODE, number: digits.slice(3) }
  return { code: fallbackCode, number: nationalDigits(digits) }
}

/** Message d'erreur (texte français, à passer à t()) ou null si le numéro est valide */
export function phoneError(code, value) {
  const n = nationalDigits(value)
  if (code === DEFAULT_CODE) return n.length === 9 ? null : 'Numéro invalide : 9 chiffres après +243.'
  return n.length >= 6 && n.length <= 12 ? null : 'Numéro invalide : 6 à 12 chiffres après l’indicatif.'
}

/** Numéro envoyé à l'API : « +243 812345678 » */
export const formatPhone = (code, value) => `+${code} ${nationalDigits(value)}`
