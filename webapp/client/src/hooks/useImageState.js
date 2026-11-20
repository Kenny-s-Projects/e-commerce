import { useCallback, useState } from 'react'

/**
 * État de chargement d'une photo, pour la faire apparaître en fondu.
 *   const { attach, onLoad, onError, ready, failed, cached, fadeClass } = useImageState()  // à déstructurer (règle React Compiler)
 *   <img ref={attach} onLoad={onLoad} onError={onError}
 *        className={`img-fade ${ready ? 'opacity-100' : 'opacity-0'}`} />
 *
 *  ready  : la photo est affichable
 *  failed : la photo n'a pas pu être chargée (afficher un repli au lieu d'une image cassée)
 *  cached : la photo était déjà en cache (ou arrivée en moins de 80 ms) → affichée tout de suite, sans fondu
 *  fadeClass : classes prêtes à l'emploi (fondu de 0,4 s, ou rien si déjà en cache)
 */
export default function useImageState() {
  const [state, setState] = useState('loading') // loading | ready | error
  const [cached, setCached] = useState(false)

  // Image déjà décodée (cache du navigateur) : pas d'animation inutile
  const attach = useCallback((img) => {
    if (!img || !img.complete) return
    if (img.naturalWidth > 0) {
      setCached(true)
      setState('ready')
    } else if (img.currentSrc) {
      setState('error')
    }
  }, [])

  // Chargée très vite (cache, ou simple revalidation) : affichée d'un coup, le fondu serait du bruit
  const onLoad = useCallback((e) => {
    try {
      const img = e?.currentTarget
      const entry = img && performance.getEntriesByName(img.currentSrc).pop()
      if (entry && (entry.transferSize === 0 || entry.duration < 80)) setCached(true)
    } catch {
      // Resource Timing indisponible : fondu normal
    }
    setState('ready')
  }, [])
  const onError = useCallback(() => setState('error'), [])

  const ready = state === 'ready'
  return {
    attach,
    onLoad,
    onError,
    ready,
    failed: state === 'error',
    cached,
    fadeClass: `${cached ? '' : 'img-fade'} ${ready ? 'opacity-100' : 'opacity-0'}`,
  }
}
