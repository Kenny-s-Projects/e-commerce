import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Loader from './components/Loader/Loader.jsx'
import Header from './components/Header/Header.jsx'
import Hero from './components/Hero/Hero.jsx'
import ScrollCue from './components/ScrollCue/ScrollCue.jsx'
import BrandSection from './sections/BrandSection/BrandSection.jsx'
import Selection from './sections/Selection/Selection.jsx'
import Gifts from './sections/Gifts/Gifts.jsx'
import Services from './sections/Services/Services.jsx'
import Footer from './sections/Footer/Footer.jsx'
import { houses } from './data/houses.js'
import { selection, gifts, services, contact, footer } from './data/home.js'
import { hasSeenIntro } from './utils/intro.js'

export default function App() {
  // Préchargeur une seule fois par session
  const [ready, setReady] = useState(hasSeenIntro)

  return (
    <>
      <AnimatePresence>
        {!ready && <Loader key="loader" onComplete={() => setReady(true)} />}
      </AnimatePresence>

      <Header cartCount={0} ready={ready} />
      <ScrollCue ready={ready} />

      <main>
        <Hero houses={houses} ready={ready} />

        {/* 01 Kyra · 02 Patchi · 03 adidas · 04 Celio */}
        {houses.map((house, i) => (
          <BrandSection key={house.id} house={house} index={i + 1} total={houses.length} />
        ))}

        <Selection items={selection} />
        <Gifts gifts={gifts} />
        <Services items={services} />
      </main>

      <Footer footer={footer} contact={contact} />
    </>
  )
}
