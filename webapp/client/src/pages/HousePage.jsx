import { useRef, useState } from 'react'
import PageCurtain from '../components/PageCurtain/PageCurtain.jsx'
import HouseHero from '../sections/house/HouseHero.jsx'
import Collections from '../sections/house/Collections.jsx'
import Catalogue from '../sections/house/Catalogue.jsx'
import NextHouse from '../sections/house/NextHouse.jsx'
import { getHouse } from '../data/houses.js'

/**
 * Page d'une Maison (même gabarit pour Kyra, Patchi, adidas et Celio) :
 * Hero animé → Collections → Filtres + grille (avec bandeau éditorial) → Maison suivante.
 * Le pied de page est commun à toutes les pages (dans App).
 */
export default function HousePage({ house }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('selection')
  const barRef = useRef(null)

  // Choisir une collection (cartes ou bandeau) : filtre + défile jusqu'à la grille
  const selectAndScroll = (id) => {
    setFilter(id)
    const bar = barRef.current
    if (bar) {
      const top = bar.getBoundingClientRect().top + window.scrollY - 56
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div className={house.shop.colors.page}>
      <PageCurtain className={house.shop.colors.hero.split(' ')[0]} />

      <HouseHero house={house} />
      <Collections house={house} active={filter} onSelect={selectAndScroll} />
      <Catalogue
        ref={barRef}
        house={house}
        filter={filter}
        onFilter={selectAndScroll}
        sort={sort}
        onSort={setSort}
      />
      <NextHouse next={getHouse(house.shop.next)} />
    </div>
  )
}
