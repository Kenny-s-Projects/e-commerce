import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api.js'
import { BRANDS } from '../data/demo.js'
import { money } from '../lib/format.js'
import { Card, Mono, PageTitle, Pill } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'

const IN = { bg: '#e1eee2', fg: '#2f5a37' }
const OUT = { bg: '#f7deda', fg: '#8e2118' }

// Stock lisible : pièces, ou kilos pour les produits vendus au poids
const stockText = (p) => (p.unit === 'kg' ? `${Number(p.stock_kg ?? 0).toLocaleString('fr-FR')} kg` : `${p.stock} pièce(s)`)

/*
 * Disponibilités : stock réel des produits de la Maison (GET /catalog/products?brand=…).
 * Lecture seule pour l'instant : le stock viendra de la synchronisation avec l'ERP (eshopaid).
 */
export default function Availability({ brand }) {
  const b = BRANDS[brand]
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let alive = true
    api
      .get('/catalog/products', { brand, limit: 100 })
      .then((r) => alive && setProducts(r.items))
      .catch((err) => alive && setError(err.message))
    return () => {
      alive = false
    }
  }, [brand])

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    const all = products ?? []
    return q ? all.filter((p) => `${p.name_fr} ${p.category_fr ?? ''} ${p.ref ?? ''}`.toLowerCase().includes(q)) : all
  }, [products, search])

  const inStock = (p) => (p.variants ?? []).some((v) => v.in_stock ?? v.stock > 0)
  const out = (products ?? []).filter((p) => !inStock(p)).length

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={`${b.name} · Gombe`} before="Disponi" accent="bilités" />
        {products && (
          <p className="text-sm text-d-muted">
            <Mono>{products.length - out}</Mono> en stock · <Mono>{out}</Mono> en rupture
          </p>
        )}
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
        {!products && <li className="px-4 py-8 text-center text-sm text-d-muted">{error || 'Chargement des produits…'}</li>}
        {list.map((p) => {
          const ok = inStock(p)
          return (
            <li key={p.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{p.name_fr}</p>
                <p className="truncate text-[13px] text-d-muted">
                  {[p.category_fr, p.ref].filter(Boolean).join(' · ')}
                  {p.price_from != null && (
                    <>
                      {' · '}
                      <Mono>{money(p.price_from)}</Mono>
                      {p.unit === 'kg' && ' les 250 g'}
                    </>
                  )}
                  {' · '}
                  {stockText(p)}
                </p>
              </div>
              <Pill tone={ok ? IN : OUT}>{ok ? 'En stock' : 'Rupture'}</Pill>
            </li>
          )
        })}
        {products && !list.length && <li className="px-4 py-8 text-center text-sm text-d-muted">Aucun produit ne correspond.</li>}
      </Card>

      <p className="mt-6 text-xs text-d-muted">Le stock se met à jour avec les commandes et, bientôt, avec l’ERP. Une rupture sur une commande se signale depuis la file des commandes.</p>
    </>
  )
}
