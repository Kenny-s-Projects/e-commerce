import Header from './components/Header/Header.jsx'
import Hero from './components/Hero/Hero.jsx'
import BrandSection from './sections/BrandSection/BrandSection.jsx'
import { houses } from './data/houses.js'

export default function App() {
  const kyra = houses.find((h) => h.id === 'kyra')

  return (
    <>
      <Header cartCount={0} />
      <main>
        <Hero houses={houses} />
        <BrandSection house={kyra} index={1} total={houses.length} />
      </main>
    </>
  )
}