import { useSyncExternalStore } from 'react'

/**
 * true tant que la media query correspond.
 * Ex. useMediaQuery('(hover: hover)') → true sur ordinateur (souris), false sur mobile (tactile).
 */
export default function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
