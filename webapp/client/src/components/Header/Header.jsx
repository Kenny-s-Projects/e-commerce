import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import './Header.css'

export default function Header({ cartCount = 0, onMenu, onSearch, onCart }) {
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
      className={`header ${scrolled ? 'header--scrolled' : ''}`}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <a href="/" className="header__logo">kclick</a>

      <nav className="header__nav">
        <button className="header__link caps" onClick={onMenu}>Menu</button>
        <button className="header__link caps" onClick={onSearch}>Recherche</button>
        <button className="header__link caps" onClick={onCart}>
          Panier ({cartCount})
        </button>
      </nav>
    </motion.header>
  )
}