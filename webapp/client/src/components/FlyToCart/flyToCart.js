/*
 * Vol vers le panier : une vignette du produit part de la photo et rejoint l'icône du panier,
 * puis le compteur du panier « rebondit ».
 *
 *   flyToCart({ from: elementPhoto, src: urlImage })
 *
 * - Aucune dépendance React : un calque fixe est créé à la volée et animé avec l'API Web Animations
 *   (uniquement transform et opacity, ~0,5 s).
 * - La cible est l'icône du panier visible marquée data-cart-target (header en haut de page,
 *   pastille réduite au défilement, ou icône mobile).
 * - À l'arrivée, l'événement « kclick:cart-arrive » est émis : le header fait rebondir le compteur.
 * - Mode léger ou « Réduire les animations » : pas de vignette, seulement le rebond du compteur
 *   (que MotionConfig coupe à son tour en mouvement réduit).
 */
export const CART_ARRIVE = 'kclick:cart-arrive'

const DURATION = 520
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const arrive = () => window.dispatchEvent(new Event(CART_ARRIVE))

function reduced() {
  if (typeof window === 'undefined') return true
  if (document.documentElement.hasAttribute('data-lite')) return true
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

// Icône du panier réellement visible à l'écran (la dernière trouvée l'emporte)
function cartTarget() {
  let found = null
  for (const el of document.querySelectorAll('[data-cart-target]')) {
    const r = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && style.visibility !== 'hidden' && Number(style.opacity) > 0.2) found = el
  }
  return found
}

// Image affichée dans l'élément de départ (photo du produit), sinon l'URL fournie
function imageOf(from, src) {
  const img = from?.tagName === 'IMG' ? from : from?.querySelector?.('img')
  return img?.currentSrc || img?.src || src || null
}

export function flyToCart({ from, src } = {}) {
  if (typeof window === 'undefined') return
  const target = cartTarget()
  const url = imageOf(from, src)
  if (reduced() || !target || !from || !url || typeof document.body.animate !== 'function') {
    arrive()
    return
  }

  const a = from.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  const size = Math.max(56, Math.min(120, a.width * 0.45, a.height * 0.45))

  const ghost = document.createElement('img')
  ghost.src = url
  ghost.alt = ''
  ghost.setAttribute('aria-hidden', 'true')
  Object.assign(ghost.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '999px',
    background: '#f3f2ef',
    boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
    pointerEvents: 'none',
    zIndex: '80',
    willChange: 'transform, opacity',
  })
  document.body.appendChild(ghost)

  // Départ : centre de la photo ; arrivée : centre de l'icône ; léger arc vers le haut
  const x0 = a.left + a.width / 2 - size / 2
  const y0 = a.top + a.height / 2 - size / 2
  const x1 = b.left + b.width / 2 - size / 2
  const y1 = b.top + b.height / 2 - size / 2
  const lift = Math.min(120, Math.abs(y1 - y0) * 0.35 + 40)

  const anim = ghost.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(0.6)`, opacity: 0 },
      { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - lift}px) scale(0.7)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${x1}px, ${y1}px) scale(0.18)`, opacity: 0.4 },
    ],
    { duration: DURATION, easing: EASE, fill: 'forwards' },
  )
  const done = () => {
    ghost.remove()
    arrive()
  }
  anim.onfinish = done
  anim.oncancel = done
}
