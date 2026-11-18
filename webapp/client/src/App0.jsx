import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Loader from './components/Loader/Loader.jsx'
import Header from './components/Header/Header.jsx'
import Hero from './components/Hero/Hero.jsx'
import ScrollCue from './components/ScrollCue/ScrollCue.jsx'
import CartDrawer from './components/CartDrawer/CartDrawer.jsx'
import BrandSection from './sections/BrandSection/BrandSection.jsx'
import Selection from './sections/Selection/Selection.jsx'
import Gifts from './sections/Gifts/Gifts.jsx'
import Services from './sections/Services/Services.jsx'
import About from './sections/About/About.jsx'
import Concierge from './sections/Concierge/Concierge.jsx'
import Footer from './sections/Footer/Footer.jsx'
import Maison from './pages/Maison/Maison.jsx'
import PatchiPage from './pages/Patchi/PatchiPage.jsx'
import AdidasPage from './pages/Adidas/AdidasPage.jsx'
import CelioPage from './pages/Celio/CelioPage.jsx'
import { houses } from './data/houses.js'
import { maisons } from './data/maisons.js'
import { selection, gifts, services, contact, footer, about, concierge } from './data/home.js'
import { hasSeenIntro } from './utils/intro.js'
import useHashRoute from './hooks/useHashRoute.js'

const ease = [0.22, 1, 0.36, 1]

export default function App() {
  // Préchargeur une seule fois par session
  const [ready, setReady] = useState(hasSeenIntro)
  const route = useHashRoute()
  const pageKey = route.page === 'maison' ? `maison-${route.id}` : 'home'

  // Panier : [{ product, qty }]
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const cartCount = cart.reduce((n, l) => n + l.qty, 0)

  const addToCart = useCallback((product) => {
    if (product.price == null) return
    setCart((c) => {
      const line = c.find((l) => l.product.id === product.id)
      return line
        ? c.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l))
        : [...c, { product, qty: 1 }]
    })
  }, [])

  const setQty = useCallback((id, qty) => {
    setCart((c) => (qty <= 0 ? c.filter((l) => l.product.id !== id) : c.map((l) => (l.product.id === id ? { ...l, qty } : l))))
  }, [])

  const closeCart = useCallback(() => setCartOpen(false), [])

  // Changement de page : une fois l'ancienne page effacée, on repart du haut,
  // ou on va à la section demandée (#patchi…) si l'adresse en désigne une.
  const lastKey = useRef(pageKey)
  const pending = useRef(null)
  useLayoutEffect(() => {
    if (lastKey.current !== pageKey) pending.current = route.anchor || 'top'
    lastKey.current = pageKey
  }, [pageKey, route.anchor])

  const onPageSwap = useCallback(() => {
    const target = pending.current
    pending.current = null
    if (!target) return
    const el = target !== 'top' && document.getElementById(target)
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <>
      <AnimatePresence>
        {!ready && <Loader key="loader" onComplete={() => setReady(true)} />}
      </AnimatePresence>

      <Header cartCount={cartCount} ready={ready} onCart={() => setCartOpen(true)} />
      {route.page === 'home' && <ScrollCue ready={ready} />}

      <AnimatePresence mode="wait" initial={false} onExitComplete={onPageSwap}>
        <motion.main
          key={pageKey}
          className="pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          {route.page === 'maison' ? (
            <MaisonPage id={route.id} onAdd={addToCart} />
          ) : (
            <>
              <Hero houses={houses} ready={ready} />

              {/* 01 Kyra · 02 Patchi · 03 adidas · 04 Celio */}
              {houses.map((house, i) => (
                <BrandSection key={house.id} house={house} index={i + 1} total={houses.length} onAdd={addToCart} />
              ))}

              <Selection items={selection} />
              <Gifts gifts={gifts} />
              <Services items={services} />
              <About about={about} />
              <Concierge concierge={concierge} />
            </>
          )}
        </motion.main>
      </AnimatePresence>

      <Footer footer={footer} contact={contact} />
      <CartDrawer open={cartOpen} items={cart} onQty={setQty} onClose={closeCart} />
    </>
  )
}

// Page d'une Maison : Patchi, adidas et Celio ont leur page sur mesure, Kyra garde la page générique
function MaisonPage({ id, onAdd }) {
  if (id === 'patchi') return <PatchiPage onAdd={onAdd} />
  if (id === 'adidas') return <AdidasPage onAdd={onAdd} />
  if (id === 'celio') return <CelioPage onAdd={onAdd} />
  return <Maison maison={maisons[id]} onAdd={onAdd} />
}
