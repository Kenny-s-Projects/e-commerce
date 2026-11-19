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
import { useT } from '../../i18n/lang.js'

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

export default function PatchiPage({ onAdd }) {
  const t = useT()
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
      {flavors.length > 0 && <PralineShowcase flavors={flavors} weights={patchiPage.weights} pricePerKg={patchiPage.pricePerKg} onAdd={onAdd} />}
      <BoxComposer ref={composerRef} flavors={patchiFlavors} sizes={patchiPage.boxSizes} pricePerKg={patchiPage.pricePerKg} />
      {live.status !== 'ready' && (
        <div className="px-gutter py-16 text-center">
          {live.status === 'error' ? (
            <>
              <p className="text-[17px]">{t('Le catalogue Patchi ne répond pas pour le moment.')}</p>
              <p className="mt-2 text-[13px] opacity-75">{live.error?.message}</p>
              <button type="button" onClick={loadLive} className="caps mt-5 border-b border-current pb-1">{t('Réessayer')}</button>
            </>
          ) : (
            <p className="text-[15px] opacity-75">{t('Chargement du catalogue…')}</p>
          )}
        </div>
      )}
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
        visual={<img src="/img/logos/kyra-heroSection2.png" alt="Image de Kyra" className="h-[clamp(140px,16vw,240px)] w-auto mix-blend-multiply max-sm:hidden" />}
      />
    </div>
  )
}
