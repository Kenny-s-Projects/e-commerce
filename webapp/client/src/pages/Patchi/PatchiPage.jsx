import { useMemo, useRef, useState } from 'react'
import BoxReveal from './BoxReveal.jsx'
import MaisonCode from './MaisonCode.jsx'
import PralineShowcase from './PralineShowcase.jsx'
import BoxComposer from './BoxComposer.jsx'
import CollectionIndex from './CollectionIndex.jsx'
import CatalogueGrid from '../../components/maison/CatalogueGrid.jsx'
import NextMaison from '../../components/maison/NextMaison.jsx'
import { patchiFlavors, patchiPage } from '../../data/maisonPages.js'
import { loadLive, useLive } from '../../data/live.js'

const HOUSE = { id: 'patchi', name: 'Patchi' }

/**
 * Page Patchi, maison de chocolat :
 * 1. Hero : le coffret s'ouvre au défilement      2. Le code de la Maison
 * 3. Les pralines, une par écran                   4. Composer son coffret
 * 5. Index des collections                         6. Grille filtrée
 * 7. Maison suivante (Kyra)
 */
// Petite phrase sous chaque rayon du catalogue réel
const COLLECTION_NOTES = {
  smallboxes: 'Boîtes garnies, de 100 à 315 g',
  giftboxes: 'Grands coffrets garnis',
  deluxe: 'Au poids : 250 g, 500 g ou 1 kg',
  classic: 'Au poids : 250 g, 500 g ou 1 kg',
  sansucre: 'Au poids, sans sucre ajouté',
}

// Coffret sur mesure : masqué tant que la commande d'un coffret composé n'est pas gérée par l'API
// (remettre à true pour réafficher la section ; le composant BoxComposer est conservé)
const SHOW_BOX_COMPOSER = false

export default function PatchiPage({ onAdd }) {
  const [filter, setFilter] = useState({})
  const composerRef = useRef(null)
  const barRef = useRef(null)
  const live = useLive()

  // Catalogue réel (API) : produits Patchi et rayons qui en contiennent
  const products = useMemo(() => live.products.filter((p) => p.maison === 'patchi'), [live.products])
  const collections = useMemo(
    () =>
      (live.brands.patchi?.categories ?? [])
        .filter((c) => products.some((p) => p.cat === c.slug))
        .map((c) => ({ id: c.slug, label: c.name_fr, note: COLLECTION_NOTES[c.slug] ?? '' })),
    [live.brands, products],
  )
  // Pralines au poids présentées une à une : seulement celles vendues dans le catalogue réel
  const flavors = useMemo(
    () => (live.status === 'ready' ? patchiFlavors.filter((f) => products.some((p) => p.id === f.id)) : patchiFlavors),
    [live.status, products],
  )

  // Chargement du catalogue réel : squelettes, puis produits ; erreur → message + « Réessayer » (jamais de squelette sans fin)
  const catalogStatus = live.status === 'error' ? 'error' : live.status === 'ready' ? 'ready' : 'loading'

  const list = useMemo(() => products.filter((p) => !filter.cat || p.cat === filter.cat), [products, filter])
  const counts = useMemo(() => Object.fromEntries(collections.map((c) => [c.id, products.filter((p) => p.cat === c.id).length])), [collections, products])

  const toggle = (key, id) => setFilter((f) => ({ ...f, [key]: f[key] === id ? null : id }))
  const pickCollection = (id) => {
    setFilter({ cat: id })
    barRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bg-paper text-forest [--card:#ffffff] [--fg:var(--color-forest)]">
      <BoxReveal
        composeLabel={SHOW_BOX_COMPOSER ? 'Composer un coffret' : 'Découvrir les chocolats'}
        onCompose={() => (SHOW_BOX_COMPOSER ? composerRef : barRef).current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />
      {/* <MaisonCode pillars={patchiPage.pillars} /> */}
      <CollectionIndex collections={collections} counts={counts} total={products.length} onPick={pickCollection} loading={catalogStatus === 'loading'} />
      {flavors.length > 0 && <PralineShowcase flavors={flavors} weights={patchiPage.weights} pricePerKg={patchiPage.pricePerKg} onAdd={onAdd} />}
      {SHOW_BOX_COMPOSER && <BoxComposer ref={composerRef} flavors={patchiFlavors} sizes={patchiPage.boxSizes} pricePerKg={patchiPage.pricePerKg} />}
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
        status={catalogStatus}
        error={live.error}
        onRetry={loadLive}
      />
      <NextMaison
        id="kyra"
        name="Kyra"
        className="bg-kyra text-kyra-ink"
        visual={<img loading="lazy" decoding="async" src="/img/logos/kyra-heroSection2.webp" alt="Image de Kyra" className="h-[clamp(140px,16vw,240px)] w-auto mix-blend-multiply max-sm:hidden" />}
      />
    </div>
  )
}
