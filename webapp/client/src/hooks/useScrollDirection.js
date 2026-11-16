import { useEffect, useState } from 'react'

/**
 * Sens du défilement de la page : 'down' ou 'up'.
 * Ne provoque un nouveau rendu que lorsque le sens change (pas à chaque pixel).
 */
export default function useScrollDirection(threshold = 4) {
  const [direction, setDirection] = useState('down')

  useEffect(() => {
    let lastY = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < threshold) return
      setDirection(y > lastY ? 'down' : 'up')
      lastY = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return direction
}
