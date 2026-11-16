import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Loader from './components/Loader/Loader.jsx'
import Header from './components/Header/Header.jsx'
import Hero from './components/Hero/Hero.jsx'
import ScrollCue from './components/ScrollCue/ScrollCue.jsx'
import BrandSection from './sections/BrandSection/BrandSection.jsx'
import { houses } from './data/houses.js'
import { hasSeenIntro } from './utils/intro.js'

export default function App() {
  // Préchargeur une seule fois par session
  const [ready, setReady] = useState(hasSeenIntro)

  const kyra = houses.find((h) => h.id === 'kyra')
  const patchi = houses.find((h) => h.id === 'patchi')

  return (
    <>
      <AnimatePresence>
        {!ready && <Loader key="loader" onComplete={() => setReady(true)} />}
      </AnimatePresence>

      <Header cartCount={0} ready={ready} />
      <ScrollCue ready={ready} />

      <main>

        <Hero houses={houses} ready={ready} />
        <BrandSection house={kyra} index={1} total={houses.length} />
        <BrandSection house={patchi} index={2} total={houses.length} />
      </main>
    </>
  )
}
