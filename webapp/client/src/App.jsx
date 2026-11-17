import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Loader from './components/Loader/Loader.jsx'
import Header from './components/Header/Header.jsx'
import ScrollCue from './components/ScrollCue/ScrollCue.jsx'
import Footer from './sections/Footer/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import HousePage from './pages/HousePage.jsx'
import PageCurtain from './components/PageCurtain/PageCurtain.jsx'
import useHashRoute from './hooks/useHashRoute.js'
import { getHouse } from './data/houses.js'
import { contact, footer } from './data/home.js'
import { hasSeenIntro } from './utils/intro.js'

/**
 * Pages :
 *   #               → accueil
 *   #maison/kyra    → page Maison (kyra, patchi, adidas, celio)
 */
export default function App() {
  // Préchargeur une seule fois par session
  const [ready, setReady] = useState(hasSeenIntro)
  const route = useHashRoute()
  const house = route.page === 'house' ? getHouse(route.id) : null
  const [firstPage] = useState(route)

  return (
    <>
      <AnimatePresence>
        {!ready && <Loader key="loader" onComplete={() => setReady(true)} />}
      </AnimatePresence>

      {/* Header blanc sur un hero sombre (adidas) ; inversé automatiquement sur les colonnes de l'accueil */}
      <Header cartCount={0} ready={ready} invert={Boolean(house?.shop.dark)} blend={!house} />
      <ScrollCue ready={ready} />

      <main>
        {house ? (
          <HousePage key={house.id} house={house} />
        ) : (
          <>
            {/* Retour à l'accueil depuis une Maison : rideau beige */}
            {route !== firstPage && <PageCurtain className="bg-beige" />}
            <HomePage ready={ready} />
          </>
        )}
      </main>

      <Footer footer={footer} contact={contact} />
    </>
  )
}
