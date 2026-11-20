import { RideCard, SkeletonGroup } from '../../components/Skeleton/Skeleton.jsx'
import { LoadError } from '../ui/skeletons.jsx'
import { useEffect, useRef, useState } from 'react'
import { BRANDS } from '../data/demo.js'
import { useStore } from '../store/store.jsx'
import { ago, money, since } from '../lib/format.js'
import { PART_STATUS } from '../lib/status.js'
import { Button, Mono, PageTitle } from '../ui/ui.jsx'

/*
 * File des commandes d'une Maison : seule sa part de chaque commande s'affiche.
 * Nouvelles → En préparation → Prêtes. Un son retentit à chaque nouvelle commande.
 */

const COLUMNS = [
  { id: 'nouvelle', title: 'Nouvelles' },
  { id: 'en_preparation', title: 'En préparation' },
  { id: 'prete', title: 'Prêtes' },
]

// Petit signal sonore (WebAudio). Le navigateur n'autorise le son qu'après un premier geste de l'utilisateur.
let audio = null
function unlockAudio() {
  try {
    if (!audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (Ctx) audio = new Ctx()
    }
    if (audio?.state === 'suspended') audio.resume()
  } catch {
    audio = null
  }
}
function chime() {
  try {
    if (!audio || audio.state !== 'running') return
    const t = audio.currentTime
    for (const [i, freq] of [880, 1320].entries()) {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t + i * 0.16)
      gain.gain.exponentialRampToValueAtTime(0.18, t + i * 0.16 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.35)
      osc.connect(gain).connect(audio.destination)
      osc.start(t + i * 0.16)
      osc.stop(t + i * 0.16 + 0.4)
    }
  } catch {
    /* pas de son : tant pis */
  }
}

const Chip = ({ green, children }) => (
  <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs ${green ? 'bg-[#e1eee2] text-[#2f5a37]' : 'bg-d-soft text-d-ink'}`}>
    {children}
  </span>
)

function RefuseForm({ onCancel, onConfirm }) {
  const [reason, setReason] = useState('Rupture de stock')
  const [other, setOther] = useState('')
  const final = reason === 'autre' ? other.trim() : reason
  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-d-danger/30 bg-[#fbf3f1] p-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (final) onConfirm(final)
      }}
    >
      <fieldset className="flex flex-col gap-2 text-[13px]">
        <legend className="mb-1 font-medium text-d-danger">Motif de la rupture</legend>
        {['Rupture de stock', 'Article abîmé', 'autre'].map((r) => (
          <label key={r} className="flex items-center gap-2">
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-d-danger" />
            {r === 'autre' ? 'Autre motif' : r}
          </label>
        ))}
        {reason === 'autre' && (
          <input
            autoFocus
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Précisez…"
            aria-label="Autre motif"
            className="h-10 rounded-lg border border-d-line bg-white px-3 text-sm outline-none focus:border-d-ink"
          />
        )}
      </fieldset>
      <p className="text-xs text-d-muted">Le client est prévenu ; le reste de sa commande continue.</p>
      <div className="flex gap-2">
        <Button variant="soft" size="sm" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={!final} className="flex-1 bg-d-danger hover:bg-[#6f1a13]">
          Confirmer la rupture
        </Button>
      </div>
    </form>
  )
}

function PartCard({ order, part, brand, now, fresh, dispatch }) {
  const [refusing, setRefusing] = useState(false)
  // L'API ne donne à l'employé que la part de sa Maison ; les autres Maisons sont citées par leur nom
  const others = order.otherBrands
    ? order.otherBrands.map((o) => o.name)
    : order.parts.filter((p) => p.brand !== brand && p.status !== 'annulee').map((p) => BRANDS[p.brand]?.name ?? p.brand)
  const rider = order.riderName ? { name: order.riderName } : null
  const act = (type, extra) => dispatch({ type, number: order.number, brand, ...extra })

  let time
  if (part.status === 'nouvelle') time = <span className="text-d-muted">{ago(order.createdAt, now)}</span>
  else if (part.status === 'en_preparation') time = <span className="text-d-gold-ink">depuis {since(part.startedAt ?? order.createdAt, now)}</span>
  else time = <span className="text-d-muted">prête depuis {since(part.readyAt ?? order.createdAt, now)}</span>

  let readyNote = null
  if (part.status === 'prete') {
    if (order.mode === 'retrait') readyNote = 'Le client vient la chercher en boutique.'
    else if (rider) readyNote = `Livreur assigné : ${rider.name}.`
    else if (others.length) readyNote = `En attente du livreur, qui passera aussi chez ${others.join(' et ')}.`
    else readyNote = 'En attente du livreur.'
  }

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border bg-white p-4 ${fresh ? 'animate-[slidein_0.4s_ease] border-d-gold shadow-[0_0_0_3px_rgba(201,165,92,0.25)]' : 'border-d-line'}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Mono className="text-[15px]">{order.number}</Mono>
        <span className="text-xs">{time}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip>{order.mode === 'retrait' ? 'Retrait en boutique' : 'Livraison'}</Chip>
        {others.length > 0 && <Chip green>Commande avec {others.join(' et ')}</Chip>}
      </div>
      <ul className="flex flex-col gap-2.5">
        {part.items.map((it, i) => (
          <li key={i}>
            <p className="flex items-baseline justify-between gap-3 text-[15px]">
              <span>
                <strong className="font-semibold">{it.qty} ×</strong> {it.name}
              </span>
              <Mono className="text-sm">{money(it.price * it.qty)}</Mono>
            </p>
            {it.detail && <p className="mt-0.5 text-[13px] text-d-muted">{it.detail}</p>}
            {it.gift && <p className="mt-2 rounded-md bg-d-soft px-3 py-2 text-[13px]">Mot cadeau : « {it.gift} »</p>}
          </li>
        ))}
      </ul>

      {part.status === 'nouvelle' && (
        <Button className="w-full" onClick={() => act('part/start')}>
          Commencer la préparation
        </Button>
      )}
      {part.status === 'en_preparation' &&
        (refusing ? (
          <RefuseForm onCancel={() => setRefusing(false)} onConfirm={(reason) => act('part/refuse', { reason })} />
        ) : (
          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => act('part/ready')}>
              Marquer prête
            </Button>
            <Button variant="danger" size="sm" className="w-full" onClick={() => setRefusing(true)}>
              Signaler une rupture
            </Button>
          </div>
        ))}
      {part.status === 'prete' && (
        <>
          <p className="text-[13px] text-d-muted">{readyNote}</p>
          {order.mode === 'retrait' && (
            <Button variant="outline" className="w-full" onClick={() => dispatch({ type: 'order/pickedByCustomer', number: order.number })}>
              Remise au client
            </Button>
          )}
        </>
      )}
    </article>
  )
}

export default function Queue({ brand }) {
  const { orders, now, dispatch, loading, loadError, retryLoad } = useStore()
  const b = BRANDS[brand]

  // Ma part de chaque commande ouverte
  const mine = orders
    .filter((o) => !o.cancelled && !o.deliveredAt)
    .map((o) => ({ order: o, part: o.parts.find((p) => p.brand === brand) }))
    .filter((x) => x.part && COLUMNS.some((c) => c.id === x.part.status))
  const columns = COLUMNS.map((c) => ({
    ...c,
    items: mine
      .filter((x) => x.part.status === c.id)
      .sort((a, b2) => new Date(a.order.createdAt) - new Date(b2.order.createdAt)),
  }))

  // Nouvelle commande : son + surbrillance
  const seen = useRef(null)
  const [fresh, setFresh] = useState([])
  const newIds = columns[0].items.map((x) => x.order.number).join(',')
  useEffect(() => {
    if (loading) return // premier chargement : pas de son pour les commandes déjà là
    const ids = newIds ? newIds.split(',') : []
    if (seen.current) {
      const added = ids.filter((id) => !seen.current.has(id))
      if (added.length) {
        chime()
        setFresh((f) => [...f, ...added])
        setTimeout(() => setFresh((f) => f.filter((id) => !added.includes(id))), 4000)
      }
    }
    seen.current = new Set(ids)
  }, [newIds, loading])

  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle live="En direct · un son retentit à chaque nouvelle commande" before="File des " accent="commandes" />
        <p className="text-sm text-d-muted">Seule la part {b.name} de chaque commande s’affiche ici.</p>
      </header>

      {loadError && <LoadError error={loadError} onRetry={retryLoad} className="mb-4" />}

      {/* Ordinateur : 3 colonnes · téléphone : colonnes qui défilent sur le côté */}
      <div className="-mx-[clamp(16px,3vw,40px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(16px,3vw,40px)] pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {columns.map((col) => (
          <section
            key={col.id}
            aria-labelledby={`col-${col.id}`}
            className="flex w-[85vw] max-w-[380px] shrink-0 snap-start flex-col gap-3 rounded-2xl bg-d-soft p-4 md:w-auto md:max-w-none md:min-h-[560px]"
          >
            <h2 id={`col-${col.id}`} className="flex items-center gap-2.5 px-1 py-1 text-[15px] font-medium">
              <span className="size-2.5 rounded-[3px]" style={{ background: PART_STATUS[col.id].bar }} aria-hidden />
              {col.title}
              <span className="font-mono text-[13px] font-normal text-d-muted">{loading ? '…' : col.items.length}</span>
            </h2>
            {loading ? (
              // Premier chargement : cartes squelettes dans les vraies colonnes
              <SkeletonGroup label="Chargement des commandes…" className="flex flex-col gap-3 [--sk:var(--color-d-soft)]">
                {Array.from({ length: col.id === COLUMNS[0].id ? 2 : 1 }, (_, i) => <RideCard key={i} />)}
              </SkeletonGroup>
            ) : col.items.length ? (
              col.items.map(({ order, part }) => (
                <PartCard key={order.number} order={order} part={part} brand={brand} now={now} fresh={fresh.includes(order.number)} dispatch={dispatch} />
              ))
            ) : (
              <p className="px-1 py-6 text-center text-[13px] text-d-muted">Rien pour l’instant.</p>
            )}
          </section>
        ))}
      </div>

    </>
  )
}
