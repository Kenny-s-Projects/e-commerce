import { createContext, createElement, useContext, useEffect, useState } from 'react'

/*
 * Mode léger : pour les connexions lentes et les téléphones modestes.
 * Activé si l'une des conditions est vraie :
 *   - l'économiseur de données est activé (navigator.connection.saveData)
 *   - connexion slow-2g, 2g ou 3g (navigator.connection.effectiveType)
 *   - peu de mémoire (navigator.deviceMemory <= 2)
 *   - « Réduire les animations » est activé dans le système
 * navigator.connection et deviceMemory n'existent pas partout (Safari, Firefox) : on les ignore alors.
 * Pour tester, ajouter à l'adresse du site (le choix est gardé sur cet appareil) :
 *   ?lite=1     → force le mode léger      ex. https://kclick-tests.netlify.app/?lite=1
 *   ?lite=0     → le désactive
 *   ?lite=auto  → revient à la détection automatique
 * (équivalent dans la console : localStorage.setItem('kclick-lite', '1' | '0') ou removeItem)
 */
const OVERRIDE_KEY = 'kclick-lite'
const SLOW = ['slow-2g', '2g', '3g']

// ?lite=1 | 0 | auto dans l'adresse : enregistre le choix puis retire le paramètre de l'adresse
;(function applyUrlOverride() {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    const v = url.searchParams.get('lite')
    if (v === null) return
    if (v === '1' || v === '0') localStorage.setItem(OVERRIDE_KEY, v)
    else localStorage.removeItem(OVERRIDE_KEY)
    url.searchParams.delete('lite')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  } catch {
    /* stockage indisponible : on garde la détection automatique */
  }
})()

function readOverride() {
  try {
    const v = localStorage.getItem(OVERRIDE_KEY)
    return v === '1' ? true : v === '0' ? false : null
  } catch {
    return null
  }
}

function reducedMotionQuery() {
  if (typeof window === 'undefined' || !window.matchMedia) return null
  return window.matchMedia('(prefers-reduced-motion: reduce)')
}

export function detectLiteMode() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const override = readOverride()
  if (override !== null) return override
  const c = navigator.connection
  if (c?.saveData) return true
  if (c?.effectiveType && SLOW.includes(c.effectiveType)) return true
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2) return true
  return Boolean(reducedMotionQuery()?.matches)
}

/** true si le mode léger est actif ; suit les changements (réseau, préférence système) */
export function useLiteModeDetection() {
  const [lite, setLite] = useState(detectLiteMode)
  useEffect(() => {
    const update = () => setLite(detectLiteMode())
    const mq = reducedMotionQuery()
    const c = navigator.connection
    mq?.addEventListener?.('change', update)
    c?.addEventListener?.('change', update)
    window.addEventListener('storage', update)
    return () => {
      mq?.removeEventListener?.('change', update)
      c?.removeEventListener?.('change', update)
      window.removeEventListener('storage', update)
    }
  }, [])
  return lite
}

export const LiteModeContext = createContext(false)

/** À placer une fois en haut de l'application (Root.jsx) */
export function LiteModeProvider({ children }) {
  const lite = useLiteModeDetection()
  useEffect(() => {
    document.documentElement.toggleAttribute('data-lite', lite)
  }, [lite])
  return createElement(LiteModeContext.Provider, { value: lite }, children)
}

/** true si le mode léger est actif */
export default function useLiteMode() {
  return useContext(LiteModeContext)
}
