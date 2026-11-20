import { LoadError, RidesSkeleton } from '../ui/skeletons.jsx'
import { useStore } from '../store/store.jsx'
import { BRANDS } from '../data/demo.js'
import { hour, today } from '../lib/format.js'
import { Card, Mono, Pill } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { brandsOf, courseState, PART_TEXT, pickupParts, shortStreet, useRider } from './rider.js'

/** Bouton « Disponible pour une course » (vert quand disponible) */
export function AvailabilitySwitch({ rider, busy, onChange }) {
  const on = rider.available
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`flex h-[52px] w-full items-center justify-between rounded-xl border border-[#3a3631] px-4 text-[15px] text-white transition-colors duration-300 ${on ? 'bg-[#2f6b40]' : 'bg-[#2a2622]'}`}
    >
      <span className="text-left leading-tight">
        {on ? 'Disponible pour une course' : 'Indisponible'}
        {busy && <span className="block text-xs text-white/70">Course en cours : vous restez visible du dispatch</span>}
      </span>
      <span className="relative inline-block h-[26px] w-11 shrink-0 rounded-full bg-white/25" aria-hidden>
        <span className={`absolute top-[3px] size-5 rounded-full bg-white transition-[left] duration-300 ${on ? 'left-[21px]' : 'left-[3px]'}`} />
      </span>
    </button>
  )
}

function CourseCard({ order }) {
  const state = courseState(order)
  return (
    <a
      href={`#livreur/course/${order.number}`}
      className="block rounded-[14px] border-2 border-d-gold-ink bg-white p-4 transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
    >
      <span className="mb-2 flex items-center justify-between gap-3">
        <Mono className="text-[15px]">{order.number}</Mono>
        <Pill tone={state.tone}>{state.label}</Pill>
      </span>
      <span className="mb-1 block text-[15px]">{order.customer.name}</span>
      <span className="mb-3 block text-[13px] text-d-muted">
        {order.address?.commune} · {shortStreet(order.address?.street)}
      </span>
      <span className="flex flex-col gap-2 border-t border-d-soft pt-3">
        {pickupParts(order).map((p) => (
          <span key={p.brand} className="flex justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: BRANDS[p.brand].color }} aria-hidden />
              {BRANDS[p.brand].name}
            </span>
            <span style={{ color: PART_TEXT[p.status].color }}>{PART_TEXT[p.status].label}</span>
          </span>
        ))}
      </span>
      <span className="mt-3.5 flex items-center justify-between gap-3 text-sm">
        <span className="text-d-muted">Paiement</span>
        <span className="text-right text-[#1f4a2c]">Paiement en ligne · rien à encaisser</span>
      </span>
    </a>
  )
}

function DoneRow({ order }) {
  return (
    <div className="rounded-[14px] border border-d-line bg-white p-4 opacity-85">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Mono className="text-[15px]">{order.number}</Mono>
        <Pill tone={{ bg: '#d7e9dc', fg: '#1f4a2c' }}>Livrée à {hour(order.deliveredAt)}</Pill>
      </div>
      <p className="text-sm text-d-muted">
        {order.customer.name} · {brandsOf(order)} · paiement en ligne
      </p>
    </div>
  )
}

function Row({ label, children, muted }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-d-soft py-3 text-sm last:border-0">
      <span className={muted ? 'text-d-muted' : ''}>{label}</span>
      {children}
    </div>
  )
}

/** Livreur · Mes courses */
export default function Courses() {
  const { rider, current, delivered, dispatch, loading } = useRider()
  const { loadError, retryLoad } = useStore()
  // Premier chargement : bandeau + cartes de course squelettes ; échec : message + « Réessayer »
  if (!rider && loading) {
    return (
      <>
        <header className="bg-d-ink px-5 pb-5 pt-[calc(22px+env(safe-area-inset-top))]" aria-hidden>
          <div className="mb-[18px] flex items-center justify-between">
            <span className="text-lg tracking-[0.04em] text-[#f2efe8]">kclick</span>
          </div>
          <div className="sk h-7 w-48 rounded-full [--sk:rgb(255_255_255/0.1)] [--sk-shine:rgb(255_255_255/0.12)]" />
          <div className="sk mt-4 h-12 w-full rounded-[14px] [--sk:rgb(255_255_255/0.1)] [--sk-shine:rgb(255_255_255/0.12)]" />
        </header>
        <div className="px-4 pt-[18px]">
          <RidesSkeleton />
        </div>
      </>
    )
  }
  if (!rider && loadError) {
    return (
      <div className="px-4 pt-[18px]">
        <LoadError error={loadError} onRetry={retryLoad} />
      </div>
    )
  }
  if (!rider) return <p className="px-5 py-16 text-center text-sm text-d-muted">Profil livreur introuvable.</p>

  return (
    <>
      <header className="bg-d-ink px-5 pb-5 pt-[calc(22px+env(safe-area-inset-top))] text-[#f2efe8]">
        <div className="mb-[18px] flex items-center justify-between">
          <span className="text-lg tracking-[0.04em]">kclick</span>
          <span className="text-xs text-[#b9b3a7]">{today()}</span>
        </div>
        <p className="mb-3.5 text-[26px] font-light">
          Bonjour <span className="font-serif italic">{rider.firstName}</span>
        </p>
        <AvailabilitySwitch
          rider={rider}
          busy={current.length > 0}
          onChange={(available) => dispatch({ type: 'rider/availability', riderId: rider.id, available })}
        />
      </header>

      <div className="flex flex-col gap-3 px-4 pb-3 pt-[18px]">
        <h1 className="mx-1 mt-1 text-[15px] font-medium">Courses du jour</h1>

        {current.map((o) => (
          <CourseCard key={o.number} order={o} />
        ))}

        {current.length === 0 && (
          <Card className="flex flex-col items-center gap-2 px-5 py-8 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-d-soft">
              <Icon name="bike" className="size-5" />
            </span>
            <p className="text-[15px]">Aucune course pour l’instant</p>
            <p className="max-w-[280px] text-[13px] leading-relaxed text-d-muted">
              Le dispatch vous attribue les courses. Vous recevrez une notification.
            </p>
          </Card>
        )}

        {delivered.map((o) => (
          <DoneRow key={o.number} order={o} />
        ))}

        <h2 className="mx-1 mt-2.5 text-[15px] font-medium">Ma journée</h2>
        <Card className="px-4 py-1.5">
          <Row label="Courses livrées">
            <Mono>{delivered.length}</Mono>
          </Row>
          <Row label="Courses en cours">
            <Mono>{current.length}</Mono>
          </Row>
          <Row label="Paiements" muted>
            <span className="text-right text-[#1f4a2c]">Tous en ligne, rien à remettre</span>
          </Row>
        </Card>
      </div>
    </>
  )
}
