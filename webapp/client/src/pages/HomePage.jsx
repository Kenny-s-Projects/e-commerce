import Hero from '../components/Hero/Hero.jsx'
import BrandSection from '../sections/BrandSection/BrandSection.jsx'
import Selection from '../sections/Selection/Selection.jsx'
import Gifts from '../sections/Gifts/Gifts.jsx'
import Services from '../sections/Services/Services.jsx'
import { houses } from '../data/houses.js'
import { selection, gifts, services } from '../data/home.js'

/**
 * Page d'accueil : Hero 4 colonnes → les 4 Maisons → Sélection → Offrir → services.
 *  ready : false tant que le préchargeur est affiché (retarde les animations du hero)
 */
export default function HomePage({ ready }) {
  return (
    <>
      <Hero houses={houses} ready={ready} />

      {/* 01 Kyra · 02 Patchi · 03 adidas · 04 Celio */}
      {houses.map((house, i) => (
        <BrandSection key={house.id} house={house} index={i + 1} total={houses.length} />
      ))}

      <Selection items={selection} />
      <Gifts gifts={gifts} />
      <Services items={services} />
    </>
  )
}
