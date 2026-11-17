import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import BagIcon from '../icons/BagIcon.jsx'

// Lien texte avec soulignement qui se dessine au survol
const linkClass =
  'caps relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-400 after:ease-lux hover:after:origin-left hover:after:scale-x-100'

export default function Header({ cartCount = 0, ready = true, onMenu, onSearch, onCart }) {
  const [scrolled, setScrolled] = useState(false)

  // Barre toujours blanche ; une ombre légère apparaît dès qu'on quitte le haut de la page
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-ink/10 bg-white px-gutter text-ink transition-shadow duration-500 ease-lux ${
        scrolled ? 'shadow-[0_8px_30px_rgba(0,0,0,0.06)]' : ''
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
          Panier (<motion.span key={cartCount} className="inline-block" initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>{cartCount}</motion.span>)
        </button>

        {/* Mobile : icône sac + pastille du nombre d'articles */}
        <button
          className="relative -m-2 p-2 sm:hidden"
          onClick={onCart}
          aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
        >
          <BagIcon className="size-[22px]" />
          <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-ink text-[9px] leading-none text-cream">
            {cartCount}
          </span>
        </button>
      </nav>
    </motion.header>
  )
}
