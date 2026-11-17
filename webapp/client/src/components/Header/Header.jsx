import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import BagIcon from '../icons/BagIcon.jsx'

// Lien texte avec soulignement qui se dessine au survol
const linkClass =
  'caps relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-400 after:ease-lux hover:after:origin-left hover:after:scale-x-100'

/**
 *  invert : texte blanc tant qu'on est en haut d'une page au hero sombre (adidas)
 *  blend  : en haut de l'accueil, le texte s'inverse selon la couleur dessous (4 colonnes de couleurs)
 */
export default function Header({ cartCount = 0, ready = true, invert = false, blend = false, onMenu, onSearch, onCart }) {
  const [scrolled, setScrolled] = useState(false)

  // La barre prend un fond dès qu'on quitte le haut de la page
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b px-gutter transition-all duration-500 ease-lux ${
        scrolled
          ? 'border-ink/10 bg-beige/90 py-4 text-ink backdrop-blur-md'
          : `border-transparent py-7 ${invert || blend ? 'text-white' : 'text-ink'} ${blend ? 'mix-blend-difference' : ''}`
      }`}
      initial={{ y: -24, opacity: 0 }}
      animate={ready ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <a href="#" className="text-[17px] font-medium tracking-wide">kclick</a>

      <nav className="flex items-center gap-[clamp(18px,2.4vw,36px)]">
        <button className={linkClass} onClick={onMenu}>Menu</button>
        <button className={`${linkClass} max-sm:hidden`} onClick={onSearch}>Recherche</button>

        {/* Ordinateur : texte « Panier (n) » */}
        <button className={`${linkClass} max-sm:hidden`} onClick={onCart}>
          Panier ({cartCount})
        </button>

        {/* Mobile : icône sac + pastille du nombre d'articles */}
        <button
          className="relative -m-2 p-2 sm:hidden"
          onClick={onCart}
          aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
        >
          <BagIcon className="size-[22px]" />
          <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-current text-[9px] leading-none">
            <span className={(invert || blend) && !scrolled ? 'text-ink' : 'text-cream'}>{cartCount}</span>
          </span>
        </button>
      </nav>
    </motion.header>
  )
}
