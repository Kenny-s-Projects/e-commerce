/*
 * Vol vers le panier : une vignette du produit part de la photo et rejoint l'icône du panier,
 * puis le compteur du panier « rebondit ».
 *
 *   flyToCart({ from: elementPhoto, src: urlImage })
 *
 * - Aucune dépendance React : un calque fixe est créé à la volée et animé avec l'API Web Animations
 *   (uniquement transform et opacity). Durée totale : FLY_DURATION (6 s, demandé par le client).
 * - Trajet : la vignette apparaît sur la photo, monte en arc, se place au-dessus du panier
 *   puis tombe dedans en rétrécissant.
 * - La cible est l'icône du panier visible marquée data-cart-target (header en haut de page,
 *   pastille réduite au défilement, ou icône mobile).
 * - À l'arrivée, l'événement « kclick:cart-arrive » est émis : le header fait rebondir le compteur.
 * - Mode léger : même trajet, sans ombre (moins coûteux à dessiner).
 * - « Réduire les animations » (réglage du système) : pas de vignette, seulement le rebond du compteur
 *   (que MotionConfig coupe à son tour en mouvement réduit).
 */
export const CART_ARRIVE = 'kclick:cart-arrive'

/** Durée totale du vol, de l'apparition à la chute dans le panier (ms) */
export const FLY_DURATION = 6_000

const arrive = () => window.dispatchEvent(new Event(CART_ARRIVE))

function reduced() {
  if (typeof window === 'undefined') return true
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

const isLite = () => document.documentElement.hasAttribute('data-lite')

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
    boxShadow: isLite() ? 'none' : '0 12px 30px rgba(0,0,0,0.18)',
    pointerEvents: 'none',
    zIndex: '80',
    willChange: 'transform, opacity',
  })
  document.body.appendChild(ghost)

  // Départ : centre de la photo ; arrivée : centre de l'icône du panier.
  // Les points du trajet restent dans l'écran (le panier est souvent tout en haut).
  const half = size / 2
  const cx0 = a.left + a.width / 2
  const cy0 = a.top + a.height / 2
  const cx1 = b.left + b.width / 2
  const cy1 = b.top + b.height / 2
  const inside = (cy, scale) => Math.max(cy, half * scale + 8) // garde la vignette entièrement visible
  const lift = Math.min(160, Math.abs(cy1 - cy0) * 0.4 + 60) // hauteur de l'arc
  const apex = { x: (cx0 + cx1) / 2, y: inside(Math.min(cy0, cy1) - lift, 0.75) }
  const above = { x: cx1, y: inside(cy1 - Math.max(48, size * 0.6), 0.5) } // au-dessus du panier, avant la chute
  const at = (cx, cy, s) => `translate(${cx - half}px, ${cy - half}px) scale(${s})`

  const anim = ghost.animate(
    [
      // apparition sur la photo
      { transform: at(cx0, cy0, 0.6), opacity: 0, easing: 'ease-out' },
      { transform: at(cx0, cy0, 1), opacity: 1, offset: 0.08, easing: 'ease-in-out' },
      // montée en arc
      { transform: at(apex.x, apex.y, 0.75), opacity: 1, offset: 0.45, easing: 'ease-in-out' },
      // au-dessus du panier
      { transform: at(above.x, above.y, 0.5), opacity: 1, offset: 0.82, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' },
      // chute dans le panier
      { transform: at(cx1, cy1, 0.15), opacity: 0.3 },
    ],
    { duration: FLY_DURATION, easing: 'linear', fill: 'forwards' },
  )
  const done = () => {
    ghost.remove()
    arrive()
  }
  anim.onfinish = done
  anim.oncancel = done
}
