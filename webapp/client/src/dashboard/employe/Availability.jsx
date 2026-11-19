import { useMemo, useState } from 'react'
import { adidasCatalog, celioCatalog, kyraCatalog, patchiCatalog } from '../../data/catalog.js'
import { BRANDS } from '../data/demo.js'
import { money } from '../lib/format.js'
import { Card, DemoNote, Mono, PageTitle, Toggle } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'

const CATALOGS = { kyra: kyraCatalog, patchi: patchiCatalog, adidas: adidasCatalog, celio: celioCatalog }

/*
 * Disponibilités : la Maison indique ce qui est en rupture.
 * Démonstration locale ; plus tard chaque bascule mettra à jour le stock via l'API.
 */
const NONE = []

export default function Availability({ brand }) {
  const b = BRANDS[brand]
  const products = CATALOGS[brand] ?? NONE
  const [search, setSearch] = useState('')
  const [out, setOut] = useState(() => new Set(products.filter((p) => p.stock === 0).map((p) => p.id)))

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? products.filter((p) => `${p.name} ${p.store ?? ''} ${p.ref ?? ''}`.toLowerCase().includes(q)) : products
  }, [products, search])

  const toggle = (id) =>
    setOut((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={`${b.name} · Gombe`} before="Disponi" accent="bilités" />
        <p className="text-sm text-d-muted">
          <Mono>{products.length - out.size}</Mono> disponible(s) · <Mono>{out.size}</Mono> en rupture
        </p>
      </header>

      <label className="mb-4 flex h-11 max-w-md items-center gap-3 rounded-lg border border-d-line bg-white px-3.5 focus-within:border-d-ink">
        <Icon name="search" className="size-4 text-d-muted" />
        <span className="sr-only">Rechercher un produit</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit, une référence…"
          className="h-full flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      <Card as="ul" className="divide-y divide-d-soft">
        {list.map((p) => {
          const available = !out.has(p.id)
          return (
            <li key={p.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{p.name}</p>
                <p className="truncate text-[13px] text-d-muted">
                  {[p.store, p.ref].filter(Boolean).join(' · ')}
                  {p.price != null && <> · <Mono>{money(p.price)}</Mono>{p.unit === 'kg' && ' le kg'}</>}
                </p>
              </div>
              <Toggle
                checked={available}
                onChange={() => toggle(p.id)}
                label={<span className={`w-[84px] text-[13px] ${available ? '' : 'text-d-danger'}`}>{available ? 'Disponible' : 'Rupture'}</span>}
              />
            </li>
          )
        })}
        {!list.length && <li className="px-4 py-8 text-center text-sm text-d-muted">Aucun produit ne correspond.</li>}
      </Card>

      <DemoNote className="mt-6">Données de démonstration : la disponibilité mettra à jour le stock via l’API.</DemoNote>
    </>
  )
}
