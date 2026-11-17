import { useMemo, useRef, useState } from 'react'
import CelioHero from './CelioHero.jsx'
import WordsImage from './WordsImage.jsx'
import Vestiaire from './Vestiaire.jsx'
import LookOfWeek from './LookOfWeek.jsx'
import CelioGrid from './CelioGrid.jsx'
import CutGuide from './CutGuide.jsx'
import NextMaison from '../../components/maison/NextMaison.jsx'
import { celioPage, PATCHI_IMG } from '../../data/maisonPages.js'

/**
 * Page Celio :
 * 1. Hero : nom géant + photo de campagne      2. « Essentiel [image] bien coupé »
 * 3. Le vestiaire, 8 rayons (filtre la grille)  4. Le look de la semaine
 * 5. Grille ou liste                            6. Trouver sa coupe      7. Maison suivante (Patchi)
 */
export default function CelioPage({ onAdd }) {
  const [cat, setCat] = useState(null)
  const [view, setView] = useState('grid')
  const gridRef = useRef(null)
  const { cats, products } = celioPage

  const list = useMemo(() => (cat ? products.filter((p) => p.cat === cat) : products).slice(0, 7), [products, cat])
  const title = cats.find((c) => c.id === cat)?.label ?? 'Tout le vestiaire'

  const pick = (id) => {
    setCat((c) => (c === id ? null : id))
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bg-white text-ink">
      <CelioHero intro={celioPage.intro} />
      <WordsImage />
      <Vestiaire cats={cats} active={cat} onPick={pick} />
      <LookOfWeek look={celioPage.look} />
      <CelioGrid ref={gridRef} products={list} title={title} view={view} onView={setView} onAdd={onAdd} onShirts={() => pick('chemises')} />
      <CutGuide cuts={celioPage.cuts} />
      <NextMaison
        id="patchi"
        name="Patchi"
        className="bg-green text-forest"
        visual={<img src={PATCHI_IMG} alt="" className="size-[clamp(120px,13vw,180px)] rounded-2xl object-cover shadow-xl max-sm:hidden" />}
      />
    </div>
  )
}
