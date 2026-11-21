import { createContext, useCallback, useContext } from 'react'

/*
 * Traduction FR / EN.
 * Le français reste écrit dans le code ; t('Texte en français') renvoie la version anglaise
 * quand la langue est EN et qu'elle existe dans les dictionnaires de i18n/en/, sinon le français.
 * Paramètres : t('{n} produits', { n: 3 }).
 */

export const LANGS = ['fr', 'en']

/*
 * Dictionnaire anglais : chargé seulement quand un visiteur choisit l'anglais
 * (les visiteurs en français ne le téléchargent jamais). Rempli par loadEnglish().
 * Les noms de produits venant de l'API y sont ajoutés par addTranslations().
 */
const EN = {}
let englishPromise = null

/** Charge le dictionnaire anglais (une seule fois) */
export function loadEnglish() {
  englishPromise ??= import('./en/index.js').then((mod) => {
    Object.assign(EN, mod.default) // le dictionnaire écrit à la main a priorité sur les noms venant de l'API
  })
  return englishPromise
}

/** Ajoute des traductions (ex. noms de produits de l'API) sans écraser les existantes */
export function addTranslations(entries) {
  for (const [k, v] of entries) if (k && v && !(k in EN)) EN[k] = v
}
const STORAGE_KEY = 'kclick-lang'

export const LangContext = createContext({ lang: 'fr', setLang: () => {} })

export const useLang = () => useContext(LangContext)

export function translate(lang, text, params) {
  if (text == null) return text
  let out = lang === 'en' ? (EN[text] ?? text) : text
  if (params) for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, v)
  return out
}

/** const t = useT() ; t('Ajouter au panier') */
export function useT() {
  const { lang, version } = useLang()
  // version change quand le dictionnaire anglais vient d'arriver : les textes se mettent à jour
  return useCallback((text, params) => translate(lang, text, params), [lang, version]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function readLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (LANGS.includes(saved)) return saved
  } catch {
    /* stockage indisponible */
  }
  return 'fr'
}

/** Le visiteur a-t-il déjà choisi une langue ? (sinon le dashboard prend celle du profil) */
export function hasSavedLang() {
  try {
    return LANGS.includes(localStorage.getItem(STORAGE_KEY))
  } catch {
    return false
  }
}

export function saveLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* stockage indisponible */
  }
}
