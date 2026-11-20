import { useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, m } from 'framer-motion'
import BagIcon from '../icons/BagIcon.jsx'
import SearchIcon from '../icons/SearchIcon.jsx'
import MenuPanel from './MenuPanel.jsx'
import SearchBar from './SearchBar.jsx'
import LangSwitch from '../LangSwitch/LangSwitch.jsx'
import { useT } from '../../i18n/lang.js'
import { CART_ARRIVE } from '../FlyToCart/flyToCart.js'

const ease = [0.22, 1, 0.36, 1]

// Lien texte avec soulignement qui se dessine au survol
const linkClass =
  'caps relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-400 after:ease-lux hover:after:origin-left hover:after:scale-x-100'

// Pastille grise (style Haven)
const pill = 'pointer-events-auto flex h-10 items-center rounded-md bg-[#f4f4f4] text-ink transition-colors duration-300 hover:bg-[#ececec]'

/**
 * Header façon Haven.
 * - En haut de page : logo à gauche, pastille « Menu » au centre, Recherche et Panier à droite.
 * - Au défilement : la barre s'efface ; il ne reste au centre que la pastille « Menu »,
 *   suivie d'une pastille Recherche (loupe) et d'une pastille Panier (sac + nombre).
 * - « Menu » ouvre un panneau qui se déplie depuis la pastille ; la loupe ouvre une barre de recherche.
 *  cartCount : nombre d'articles · ready : false pendant le préchargeur · onCart : ouvre le tiroir panier
 */
export default function Header({ cartCount = 0, ready = true, onCart }) {
  const [scrolled, setScrolled] = useState(false)
  const t = useT()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Rebond du compteur quand la vignette d'un produit arrive dans le panier (voir FlyToCart)
  const [bump, setBump] = useState(0)
  useEffect(() => {
    const onArrive = () => setBump((b) => b + 1)
    window.addEventListener(CART_ARRIVE, onArrive)
    return () => window.removeEventListener(CART_ARRIVE, onArrive)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Échap ferme ce qui est ouvert
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openMenu = () => {
    setSearchOpen(false)
    setMenuOpen(true)
  }
  const openSearch = () => {
    setMenuOpen(false)
    setSearchOpen(true)
  }

  return (
    <>
      <m.header
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-16 px-gutter text-ink transition-[background-color,border-color] duration-500 ease-lux ${
          scrolled ? 'border-b border-transparent bg-transparent' : 'border-b border-ink/10 bg-white'
        }`}
        initial={{ y: -24, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.6, ease }}
      >
        <LayoutGroup>
          <div className="relative flex h-full items-center justify-between">
            {/* Logo : disparaît au défilement */}
            <AnimatePresence initial={false}>
              {!scrolled && (
                <m.a
                  key="logo"
                  href="#"
                  className="pointer-events-auto text-[17px] font-medium tracking-wide"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.4, ease }}
                >
                  kclick
                </m.a>
              )}
            </AnimatePresence>

            {/* Centre : pastille Menu (+ Recherche et Panier une fois réduit) */}
            <m.div layout className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5" transition={{ duration: 0.5, ease }}>
              <m.button
                layout
                type="button"
                onClick={openMenu}
                aria-expanded={menuOpen}
                aria-controls="menu-panel"
                className={`${pill} justify-between gap-10 px-4 ${scrolled ? 'w-[min(280px,52vw)]' : 'w-[min(400px,46vw)] max-sm:w-[44vw]'}`}
                transition={{ duration: 0.5, ease }}
              >
                <m.span layout="position" className="text-[14px]">{t('Menu')}</m.span>
                <m.span layout="position" aria-hidden className="flex w-[60px] flex-col gap-[6px] max-sm:w-8">
                  <span className="block h-px bg-current" />
                  <span className="block h-px bg-current" />
                </m.span>
              </m.button>

              <AnimatePresence initial={false}>
                {scrolled && (
                  <m.button
                    key="search-pill"
                    type="button"
                    onClick={openSearch}
                    aria-label={t('Rechercher')}
                    className={`${pill} w-10 justify-center`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <SearchIcon />
                  </m.button>
                )}
                {scrolled && (
                  <m.button
                    key="cart-pill"
                    data-cart-target
                    type="button"
                    onClick={onCart}
                    aria-label={t('Panier, {n} article(s)', { n: cartCount })}
                    className={`${pill} gap-2 px-3`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.35, delay: 0.05, ease }}
                  >
                    <BagIcon className="size-[18px]" />
                    <CartCount count={cartCount} bump={bump} />
                  </m.button>
                )}
                {scrolled && (
                  <m.span
                    key="lang-pill"
                    className={`${pill} w-10 justify-center`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.35, delay: 0.1, ease }}
                  >
                    <LangSwitch compact className="size-full" />
                  </m.span>
                )}
              </AnimatePresence>
            </m.div>

            {/* Droite : Recherche + Panier, en haut de page */}
            <AnimatePresence initial={false}>
              {!scrolled && (
                <m.nav
                  key="right"
                  className="pointer-events-auto flex items-center gap-[clamp(18px,2.4vw,36px)]"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <LangSwitch className="caps max-sm:hidden" />
                  <LangSwitch compact className="sm:hidden" />
                  <button type="button" className={`${linkClass} max-sm:hidden`} onClick={openSearch}>{t('Recherche')}</button>
                  <button type="button" data-cart-target className={`${linkClass} max-sm:hidden`} onClick={onCart}>
                    {t('Panier')} (<CartCount count={cartCount} bump={bump} />)
                  </button>
                  {/* Mobile : icône sac + pastille */}
                  <button
                    type="button"
                    data-cart-target
                    className="relative -m-2 p-2 sm:hidden"
                    onClick={onCart}
                    aria-label={t('Panier, {n} article(s)', { n: cartCount })}
                  >
                    <BagIcon className="size-[22px]" />
                    <m.span
                      key={bump}
                      className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-ink text-[9px] leading-none text-cream"
                      initial={bump ? { scale: 1.5 } : false}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.35, ease }}
                    >
                      {cartCount}
                    </m.span>
                  </button>
                </m.nav>
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </m.header>

      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} onSearch={openSearch} />
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

// Le nombre d'articles « rebondit » quand un produit arrive dans le panier (bump change)
function CartCount({ count, bump }) {
  return (
    <m.span key={bump} className="inline-block text-[13px] tabular-nums" initial={bump ? { scale: 1.6 } : false} animate={{ scale: 1 }} transition={{ duration: 0.35, ease }}>
      {count}
    </m.span>
  )
}

