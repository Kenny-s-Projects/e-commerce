import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import ProductPage from './pages/Produit/ProductPage.jsx'
import OffrirPage from './pages/Offrir/OffrirPage.jsx'
import HistoirePage from './pages/Histoire/HistoirePage.jsx'
import AidePage from './pages/Aide/AidePage.jsx'
import QuickViewModal from './components/QuickView/QuickViewModal.jsx'
import { QuickViewContext } from './context/quickView.js'
import CheckoutPage from './pages/Checkout/CheckoutPage.jsx'
import LoginPage from './pages/Compte/LoginPage.jsx'
import SignupPage from './pages/Compte/SignupPage.jsx'
import CodePage from './pages/Compte/CodePage.jsx'
import ProfilePage from './pages/Compte/ProfilePage.jsx'
import TrackingPage from './pages/Suivi/TrackingPage.jsx'
import { LangContext, readLang, saveLang } from './i18n/lang.js'
import { houses } from './data/houses.js'
import { maisons } from './data/maisons.js'
import { selection, gifts, services, contact, footer, about, concierge } from './data/home.js'
import { hasSeenIntro } from './utils/intro.js'
import { useLive } from './data/live.js'
import useHashRoute, { pageKeyOf } from './hooks/useHashRoute.js'

const ease = [0.22, 1, 0.36, 1]

export default function App() {
  // Préchargeur une seule fois par session
  const [ready, setReady] = useState(hasSeenIntro)
  const route = useHashRoute()
  const pageKey = pageKeyOf(route)

  // Langue FR / EN, gardée d'une visite à l'autre
  const [lang, setLangState] = useState(readLang)
  const setLang = useCallback((l) => {
    setLangState(l)
    saveLang(l)
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const langValue = useMemo(() => ({ lang, setLang }), [lang, setLang])

  // Aperçu rapide : produit affiché dans la popup (null = fermée)
  const [quickProduct, setQuickProduct] = useState(null)
  const closeQuickView = useCallback(() => setQuickProduct(null), [])

  // Catalogue réel (API) : chargé dès l'arrivée sur le site
  useLive()

  // Panier : [{ product, qty }], product = ligne de panier (data/live.js cartLine : une variante du catalogue réel).
  // Gardé dans le navigateur d'une visite à l'autre.
  const [cart, setCart] = useState(readCart)
  const [cartOpen, setCartOpen] = useState(false)
  const cartCount = cart.reduce((n, l) => n + l.qty, 0)
  useEffect(() => saveCart(cart), [cart])

  const addToCart = useCallback((line, qty = 1) => {
    if (!line?.variantId || line.price == null) return
    setCart((c) => {
      const found = c.find((l) => l.product.id === line.id)
      return found
        ? c.map((l) => (l.product.id === line.id ? { ...l, qty: Math.min(50, l.qty + qty) } : l))
        : [...c, { product: line, qty }]
    })
  }, [])

  // Commande : tout le panier (bouton « Commander » du panier) ou un seul article (« Commander maintenant »)
  const [buyNow, setBuyNow] = useState(null) // [{ product, qty }] ou null = le panier
  const checkoutCart = useCallback(() => {
    setBuyNow(null)
    setCartOpen(false)
    window.location.hash = 'checkout'
  }, [])
  const checkoutOne = useCallback((product, qty) => {
    setBuyNow([{ product, qty }])
    window.location.hash = 'checkout'
  }, [])
  const onOrdered = useCallback((fromCart) => {
    if (fromCart) setCart([])
    setBuyNow(null)
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
    <LangContext.Provider value={langValue}>
    <QuickViewContext.Provider value={setQuickProduct}>
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
          ) : route.page === 'produit' ? (
            <ProductPage id={route.id} onAdd={addToCart} onBuyNow={checkoutOne} />
          ) : route.page === 'checkout' ? (
            <CheckoutPage items={buyNow ?? cart} fromCart={!buyNow} onDone={onOrdered} />
          ) : route.page === 'offrir' ? (
            <OffrirPage tab={route.id} onAdd={addToCart} />
          ) : route.page === 'histoire' ? (
            <HistoirePage />
          ) : route.page === 'aide' ? (
            <AidePage section={route.id} />
          ) : route.page === 'compte' ? (
            <LoginPage />
          ) : route.page === 'inscription' ? (
            <SignupPage />
          ) : route.page === 'code' ? (
            <CodePage />
          ) : route.page === 'profil' ? (
            <ProfilePage tab={route.id} />
          ) : route.page === 'suivi' ? (
            <TrackingPage number={route.id} />
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

      <Footer footer={footer} contact={contact} lang={lang} onLang={setLang} />
      <CartDrawer open={cartOpen} items={cart} onQty={setQty} onClose={closeCart} onCheckout={checkoutCart} />
      <QuickViewModal product={quickProduct} onClose={closeQuickView} onAdd={addToCart} />
    </QuickViewContext.Provider>
    </LangContext.Provider>
  )
}

// Page d'une Maison : Patchi, adidas et Celio ont leur page sur mesure, Kyra garde la page générique
function MaisonPage({ id, onAdd }) {
  if (id === 'patchi') return <PatchiPage onAdd={onAdd} />
  if (id === 'adidas') return <AdidasPage onAdd={onAdd} />
  if (id === 'celio') return <CelioPage onAdd={onAdd} />
  return <Maison maison={maisons[id]} onAdd={onAdd} />
}

// Panier gardé dans le navigateur (seules les lignes du catalogue réel, avec leur variante)
const CART_KEY = 'kclick-cart'
function readCart() {
  try {
    const lines = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]')
    return Array.isArray(lines) ? lines.filter((l) => l?.product?.variantId && l.qty > 0) : []
  } catch {
    return []
  }
}
function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch {
    /* stockage indisponible : le panier reste en mémoire */
  }
}
