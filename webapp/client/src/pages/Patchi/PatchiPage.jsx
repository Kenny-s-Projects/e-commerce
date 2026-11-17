import { useMemo, useRef, useState } from 'react'
import BoxReveal from './BoxReveal.jsx'
import MaisonCode from './MaisonCode.jsx'
import PralineShowcase from './PralineShowcase.jsx'
import BoxComposer from './BoxComposer.jsx'
import CollectionIndex from './CollectionIndex.jsx'
import CatalogueGrid from '../../components/maison/CatalogueGrid.jsx'
import NextMaison from '../../components/maison/NextMaison.jsx'
import { patchiFlavors, patchiPage } from '../../data/maisonPages.js'

const HOUSE = { id: 'patchi', name: 'Patchi' }

/**
 * Page Patchi, maison de chocolat :
 * 1. Hero : le coffret s'ouvre au défilement      2. Le code de la Maison
 * 3. Les pralines, une par écran                   4. Composer son coffret
 * 5. Index des collections                         6. Grille filtrée
 * 7. Maison suivante (Kyra)
 */
export default function PatchiPage({ onAdd }) {
  const [filter, setFilter] = useState({})
  const composerRef = useRef(null)
  const barRef = useRef(null)
  const { products, collections } = patchiPage

  const list = useMemo(() => products.filter((p) => !filter.cat || p.cat === filter.cat), [products, filter])
  const counts = useMemo(() => Object.fromEntries(collections.map((c) => [c.id, products.filter((p) => p.cat === c.id).length])), [collections, products])

  const toggle = (key, id) => setFilter((f) => ({ ...f, [key]: f[key] === id ? null : id }))
  const pickCollection = (id) => {
    setFilter({ cat: id })
    barRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bg-paper text-forest [--card:#ffffff] [--fg:var(--color-forest)]">
      <BoxReveal onCompose={() => composerRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      <MaisonCode pillars={patchiPage.pillars} />
      <PralineShowcase flavors={patchiFlavors} weights={patchiPage.weights} pricePerKg={patchiPage.pricePerKg} onAdd={onAdd} />
      <BoxComposer ref={composerRef} flavors={patchiFlavors} sizes={patchiPage.boxSizes} pricePerKg={patchiPage.pricePerKg} onAdd={onAdd} />
      <CollectionIndex collections={collections} counts={counts} total={products.length} onPick={pickCollection} />
      <CatalogueGrid
        ref={barRef}
        products={list}
        total={list.length}
        groups={[{ key: 'cat', label: 'Collections', options: collections }]}
        value={filter}
        onChange={toggle}
        barClass="bg-paper text-forest"
        pill="round"
        house={HOUSE}
        onAdd={onAdd}
      />
      <NextMaison
        id="kyra"
        name="Kyra"
        className="bg-kyra text-kyra-ink"
        visual={<img src="/img/dior-miss-dior-parfum.webp" alt="" className="h-[clamp(140px,16vw,240px)] w-auto mix-blend-multiply max-sm:hidden" />}
      />
    </div>
  )
}
