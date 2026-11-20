import { useRef, useState } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import useImageState from '../../hooks/useImageState.js'
import { useT } from '../../i18n/lang.js'

/**
 * Galerie d'une carte produit.
 *  - Ordinateur : la 2e image apparaît au survol de la carte (fondu + léger zoom).
 *  - Mobile     : on fait défiler les images au doigt ; une petite barre en bas indique la position.
 *
 *  images    : liste d'URL. Avec une seule photo, une vue « détail » (gros plan du produit)
 *              sert de 2e image en attendant les vraies photos.
 *  fit       : 'contain' → photo détourée (Kyra)
 *              'boxed'   → visuel carré centré (Patchi dans les sections Maison)
 *              'bleed'   → visuel plein cadre (Patchi dans la Sélection)
 *  alt       : texte alternatif
 *  href      : lien vers la fiche produit
 *  className : fond et proportions du cadre (ex. 'aspect-[4/5] bg-(--card)')
 *  swipe     : false → sur mobile, une seule image (utile dans un carrousel déjà horizontal)
 *
 *  La carte parente doit porter la classe `group` pour le survol.
 *
 *  Chargement : le cadre (couleur de la Maison) est visible tout de suite, la photo apparaît en fondu
 *  (0,4 s) une fois chargée — sans fondu si elle était déjà en cache. Photo introuvable : « Photo à venir ».
 */
export default function ProductMedia({
  images = [],
  fit = 'contain',
  alt = '',
  href = '#',
  className = '',
  swipe = true,
}) {
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')

  if (images.length === 0) {
    return (
      <a href={href} className={`relative grid place-items-center overflow-hidden ${className}`}>
        <NoPhoto />
      </a>
    )
  }

  // Une seule photo : on ajoute une vue détail pour avoir un 2e visuel
  const views =
    images.length === 1
      ? [{ src: images[0] }, { src: images[0], detail: true }]
      : images.map((src) => ({ src }))

  // Le cadre (fond de la Maison) est affiché tout de suite : la page ne « saute » pas
  const frame = `relative overflow-hidden ${className}`

  if (!canHover && !swipe) {
    return (
      <a href={href} className={`block ${frame}`}>
        <View view={views[0]} fit={fit} alt={alt} main />
      </a>
    )
  }

  return canHover ? (
    <HoverSwap views={views} fit={fit} alt={alt} href={href} className={frame} />
  ) : (
    <SwipeGallery views={views} fit={fit} alt={alt} href={href} className={frame} />
  )
}

function NoPhoto() {
  const t = useT()
  return <span className="caps absolute inset-0 m-auto grid place-items-center text-[8px] opacity-50">{t('Photo à venir')}</span>
}

/* ---------- Ordinateur : changement d'image au survol ---------- */
function HoverSwap({ views, fit, alt, href, className }) {
  const [first, second] = views

  return (
    <a href={href} className={`block ${className}`}>
      <View
        view={first}
        fit={fit}
        alt={alt}
        main
        ownTransition
        className="img-reveal [transition:opacity_0.4s_var(--ease-lux),scale_0.7s_var(--ease-lux)] group-hover:scale-104 group-hover:opacity-0"
      />
      {second && (
        <View
          view={second}
          fit={fit}
          alt=""
          fade={false}
          className="scale-104 opacity-0 transition-[opacity,scale] duration-700 ease-lux group-hover:scale-100 group-hover:opacity-100"
        />
      )}
    </a>
  )
}

/* ---------- Mobile : défilement horizontal + barre de progression ---------- */
function SwipeGallery({ views, fit, alt, href, className }) {
  const trackRef = useRef(null)
  const [progress, setProgress] = useState(0) // 0 → 1 sur toute la galerie

  const onScroll = () => {
    const el = trackRef.current
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }

  return (
    <div className={className}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {views.map((view, i) => (
          <a key={i} href={href} className="relative h-full w-full shrink-0 snap-center overflow-hidden">
            <View view={view} fit={fit} alt={i === 0 ? alt : ''} main={i === 0} />
          </a>
        ))}
      </div>

      {/* Petite barre en bas : la partie pleine suit le doigt */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-0.5 w-12 -translate-x-1/2 overflow-hidden rounded-full bg-current/15">
        <div
          className="h-full rounded-full bg-current/70"
          style={{
            width: `${100 / views.length}%`,
            transform: `translateX(${progress * (views.length - 1) * 100}%)`,
          }}
        />
      </div>
    </div>
  )
}

/* ---------- Une image, selon le mode d'affichage ---------- */
const FIT = {
  contain: 'inset-0 m-auto size-[78%] object-contain mix-blend-multiply',
  boxed: 'inset-0 m-auto aspect-square w-[78%] object-cover',
  bleed: 'inset-0 size-full object-cover',
}

// Vue détail : même photo, agrandie et centrée (gros plan)
const DETAIL = {
  contain: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[190%] max-w-none object-contain mix-blend-multiply',
  boxed: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-[120%] max-w-none object-cover',
  bleed: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[150%] max-w-none object-cover',
}

/**
 *  main          : photo principale → « Photo à venir » si elle ne se charge pas
 *  fade          : false → pas de fondu de chargement (image cachée jusqu'au survol, par ex.)
 *  ownTransition : la classe fournit déjà la transition d'opacité (ne pas ajouter .img-fade)
 */
function View({ view, fit, alt, main = false, fade = true, ownTransition = false, className = '' }) {
  const { attach, onLoad, onError, ready, failed, fadeClass } = useImageState()
  if (failed) return main ? <NoPhoto /> : null
  const state = fade ? (ownTransition ? (ready ? '' : 'opacity-0') : fadeClass) : ''
  return (
    <img
      ref={attach}
      src={view.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      onLoad={onLoad}
      onError={onError}
      className={`absolute ${view.detail ? DETAIL[fit] : FIT[fit]} ${className} ${state}`}
    />
  )
}
