import { Avatar, Card, DemoNote, Mono, telHref } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { AvailabilitySwitch } from './Courses.jsx'
import { RIDER_PHONE, useRider } from './rider.js'

const AIDE = 'https://wa.me/243856486993?text=' + encodeURIComponent('Bonjour, je suis livreur kclick et j’ai une question.')

/** Livreur · Profil */
export default function RiderProfile() {
  const { rider, current, dispatch } = useRider()
  if (!rider) return null

  return (
    <>
      <header className="bg-d-ink px-5 pb-5 pt-[calc(22px+env(safe-area-inset-top))] text-[#f2efe8]">
        <div className="mb-5 flex items-center gap-3.5">
          <Avatar name={rider.name} className="size-14 text-base" tone="bg-d-gold text-d-ink" />
          <div>
            <h1 className="text-[22px] font-light">{rider.name}</h1>
            <p className="text-[13px] text-[#b9b3a7]">
              {rider.vehicle} · zone {rider.zone}
            </p>
          </div>
        </div>
        <AvailabilitySwitch
          rider={rider}
          busy={current.length > 0}
          onChange={(available) => dispatch({ type: 'rider/availability', riderId: rider.id, available })}
        />
      </header>

      <div className="flex flex-col gap-3 px-4 pb-3 pt-[18px]">
        <Card className="px-4 py-1.5">
          <div className="flex items-center justify-between gap-3 border-b border-d-soft py-3 text-sm">
            <span className="text-d-muted">Téléphone</span>
            <a href={telHref(RIDER_PHONE)}>
              <Mono>{RIDER_PHONE}</Mono>
            </a>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-d-soft py-3 text-sm">
            <span className="text-d-muted">Véhicule</span>
            <span>{rider.vehicle}</span>
          </div>
          <div className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="text-d-muted">Zone</span>
            <span>{rider.zone}</span>
          </div>
        </Card>

        <Card as="nav" aria-label="Liens" className="px-4 py-1">
          <a href={AIDE} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 border-b border-d-soft py-3.5 text-sm">
            <span className="flex items-center gap-3">
              <Icon name="whatsapp" className="size-[18px]" />
              Aide : écrire à la conciergerie
            </span>
            <Icon name="back" className="size-4 rotate-180 text-d-muted" />
          </a>
          <a href="#dashboard" className="flex items-center justify-between gap-3 py-3.5 text-sm">
            <span className="flex items-center gap-3">
              <Icon name="logout" className="size-[18px]" />
              Démonstration : changer d’espace
            </span>
            <Icon name="back" className="size-4 rotate-180 text-d-muted" />
          </a>
        </Card>
        <DemoNote className="mx-1" />
      </div>
    </>
  )
}
