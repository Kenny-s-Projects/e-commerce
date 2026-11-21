import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hasSavedLang, readLang, saveLang } from '../../i18n/lang.js'

/*
 * Langue du dashboard (FR / EN), partagée avec le site (même préférence « kclick-lang »).
 *
 * Le français reste écrit dans le code : tr('Texte en français') renvoie l'anglais quand la langue est EN.
 * La langue est gardée dans DashboardApp : quand elle change, tout le dashboard se redessine,
 * donc tr() peut servir partout (composants, mise en forme des dates, chronologie, messages du store).
 * Le dictionnaire anglais du dashboard (i18n/en/dashboard.js) n'est téléchargé qu'en anglais.
 * Il reste séparé de celui du site : un même mot peut s'y traduire autrement (« Maison » : House / Home).
 */

let current = 'fr'
let EN = {}

/** Contexte du bouton FR | EN : { lang, effective, setLang, adoptProfileLang } */
export const DashLangContext = createContext({ lang: 'fr', effective: 'fr', setLang: () => {}, adoptProfileLang: () => {} })
export const useDashLang = () => useContext(DashLangContext)

/** Langue en cours du dashboard */
export const getLang = () => current
// Appelée pendant le rendu de DashboardApp, avant ses enfants : tout le dashboard lit la même langue
const applyLang = (l) => {
  current = l
}

/** Traduction : tr('Commandes'), tr('{n} commandes', { n: 3 }) */
export function tr(text, params) {
  if (text == null || text === '') return text
  let out = current === 'en' ? (EN[text] ?? text) : text
  if (params) for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, v)
  return out
}

let dictionaryPromise = null
const loadDashboardEnglish = () =>
  (dictionaryPromise ??= import('../../i18n/en/dashboard.js').then((mod) => {
    EN = mod.default
  }))

/**
 * État de la langue pour DashboardApp : { lang, effective, setLang, adoptProfileLang }.
 *  - setLang : choix du bouton FR | EN (gardé pour les prochaines visites)
 *  - adoptProfileLang : langue du profil, utilisée seulement si aucune préférence n'a été choisie
 *  - effective : langue affichée (le français reste affiché tant que le dictionnaire anglais n'est pas arrivé)
 */
export function useDashboardLang() {
  const [lang, setLangState] = useState(readLang)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (lang !== 'en') return
    let alive = true
    loadDashboardEnglish()
      .then(() => alive && setLoaded(true))
      .catch(() => {
        /* dictionnaire indisponible : le dashboard reste en français */
      })
    return () => {
      alive = false
    }
  }, [lang])

  const setLang = useCallback((l) => {
    saveLang(l)
    setLangState(l)
  }, [])
  const adoptProfileLang = useCallback((l) => {
    if (!hasSavedLang() && (l === 'fr' || l === 'en')) setLangState(l)
  }, [])

  // Anglais affiché seulement une fois le dictionnaire arrivé (pas de mélange pendant le chargement)
  const effective = lang === 'en' && !loaded ? 'fr' : lang
  applyLang(effective)
  useEffect(() => {
    document.documentElement.lang = effective
  }, [effective])

  return useMemo(() => ({ lang, effective, setLang, adoptProfileLang }), [lang, effective, setLang, adoptProfileLang])
}
