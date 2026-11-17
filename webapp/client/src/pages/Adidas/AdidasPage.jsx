import { useMemo, useRef, useState } from 'react'
import AdidasHero from './AdidasHero.jsx'
import Rayons from './Rayons.jsx'
import IconViewer from './IconViewer.jsx'
import SizeGuide from './SizeGuide.jsx'
import Marquee from '../../components/maison/Marquee.jsx'
import CatalogueGrid from '../../components/maison/CatalogueGrid.jsx'
import NextMaison from '../../components/maison/NextMaison.jsx'
import Reveal from '../../components/maison/Reveal.jsx'
import { adidasPage } from '../../data/maisonPages.js'

const HOUSE = { id: 'adidas', name: 'adidas' }

/**
 * Page adidas :
 * 1. Hero noir, Homme / Femme / Enfant (filtre toute la page)   2. Bandeau des modèles qui défile
 * 3. Les rayons, cartes inclinées      4. Présentoir des icônes
 * 5. Grille sur fond clair             6. Guide des tailles      7. Maison suivante (Celio)
 */
export default function AdidasPage({ onAdd }) {
  const [filter, setFilter] = useState({ who: 'homme' })
  const barRef = useRef(null)
  const { products, who, rayons } = adidasPage

  const list = useMemo(() => products.filter((p) => (!filter.who || p.who === filter.who) && (!filter.cat || p.cat === filter.cat)), [products, filter])
  const whoOptions = who.map((w) => ({ ...w, count: products.filter((p) => p.who === w.id).length }))
  const catCounts = Object.fromEntries(rayons.map((r) => [r.id, products.filter((p) => p.cat === r.id && (!filter.who || p.who === filter.who)).length]))
  const whoLabel = who.find((w) => w.id === filter.who)?.label ?? 'Tout'

  const scrollToGrid = () => barRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const toggle = (key, id) => setFilter((f) => ({ ...f, [key]: f[key] === id ? null : id }))

  return (
    <div className="bg-black text-white">
      <AdidasHero who={filter.who} onWho={(id) => setFilter((f) => ({ ...f, who: id }))} options={whoOptions} onSee={scrollToGrid} />

      <Marquee items={adidasPage.marquee} className="border-y border-white/15 py-5 text-[clamp(20px,2.4vw,32px)] font-medium uppercase tracking-[0.04em]" />

      <Rayons rayons={rayons} counts={catCounts} onPick={(id) => { setFilter((f) => ({ ...f, cat: id })); scrollToGrid() }} />
      <IconViewer icons={adidasPage.icons} colors={adidasPage.colors} sizes={adidasPage.sizes} />

      <div className="bg-white text-black [--card:#f3f3f1] [--fg:#0a0a0a]">
        <CatalogueGrid
          ref={barRef}
          title={
            <div className="flex flex-wrap items-end justify-between gap-6 px-gutter pb-8 pt-[clamp(72px,9vw,120px)]">
              <Reveal as="h2" className="text-[clamp(44px,5.6vw,80px)] font-medium uppercase leading-none tracking-[-0.03em]">{whoLabel}</Reveal>
              <p className="text-[12px] text-black/60">Photos et prix à venir</p>
            </div>
          }
          products={list}
          total={list.length}
          groups={[
            { key: 'who', options: who },
            { key: 'cat', options: rayons.map(({ id, label }) => ({ id, label })) },
          ]}
          value={filter}
          onChange={toggle}
          barClass="bg-white text-black"
          cols={4}
          house={HOUSE}
          onAdd={onAdd}
        />
      </div>

      <SizeGuide sizes={adidasPage.sizeGuide} />

      <NextMaison
        id="celio"
        name="Celio"
        className="bg-white text-ink"
        visual={<img src="/img/logos/celio.png" alt="" className="h-[clamp(40px,4.4vw,64px)] w-auto max-sm:hidden" />}
      />
    </div>
  )
}
