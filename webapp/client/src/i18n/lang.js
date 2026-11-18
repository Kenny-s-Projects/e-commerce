import { createContext, useCallback, useContext } from 'react'
import EN from './en/index.js'

/*
 * Traduction FR / EN.
 * Le français reste écrit dans le code ; t('Texte en français') renvoie la version anglaise
 * quand la langue est EN et qu'elle existe dans les dictionnaires de i18n/en/, sinon le français.
 * Paramètres : t('{n} produits', { n: 3 }).
 */

export const LANGS = ['fr', 'en']
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
  const { lang } = useLang()
  return useCallback((text, params) => translate(lang, text, params), [lang])
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

export function saveLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* stockage indisponible */
  }
}
