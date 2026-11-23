import { Avatar, Card, Mono, telHref } from '../ui/ui.jsx'
import { useStore } from '../store/store.jsx'
import Icon from '../ui/Icon.jsx'
import { AvailabilitySwitch } from './Courses.jsx'
import { useRider } from './rider.js'
import { tr } from '../lib/i18n.js'
import LangSwitch from '../ui/LangSwitch.jsx'

const AIDE = 'https://wa.me/243817723066?text=' + encodeURIComponent('Bonjour, je suis livreur kclick et j’ai une question.')

/** Livreur · Profil */
export default function RiderProfile() {
  const { rider, current, dispatch } = useRider()
  const { logout } = useStore()
  if (!rider) return null

  return (
    <>
      <header className="bg-d-ink px-5 pb-5 pt-[calc(22px+env(safe-area-inset-top))] text-[#f2efe8]">
        <div className="mb-5 flex items-center gap-3.5">
          <Avatar name={rider.name} className="size-14 text-base" tone="bg-d-gold text-d-ink" />
          <div>
            <h1 className="text-[22px] font-light">{rider.name}</h1>
            <p className="text-[13px] text-[#b9b3a7]">
              {rider.vehicle} · {tr('zone')} {rider.zone}
            </p>
          </div>
          <LangSwitch className="ml-auto self-start" />
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
            <span className="text-d-muted">{tr('Téléphone')}</span>
            {rider.phone ? (
              <a href={telHref(rider.phone)}>
                <Mono>{rider.phone}</Mono>
              </a>
            ) : (
              <span className="text-d-muted">{tr('Non renseigné')}</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-d-soft py-3 text-sm">
            <span className="text-d-muted">{tr('Véhicule')}</span>
            <span>{rider.vehicle}</span>
          </div>
          <div className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="text-d-muted">{tr('Zone')}</span>
            <span>{rider.zone}</span>
          </div>
        </Card>

        <Card as="nav" aria-label={tr('Liens')} className="px-4 py-1">
          <a href={AIDE} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 border-b border-d-soft py-3.5 text-sm">
            <span className="flex items-center gap-3">
              <Icon name="whatsapp" className="size-[18px]" />
              {tr('Aide : écrire à la conciergerie')}
            </span>
            <Icon name="back" className="size-4 rotate-180 text-d-muted" />
          </a>
          <button type="button" onClick={logout} className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm">
            <span className="flex items-center gap-3">
              <Icon name="logout" className="size-[18px]" />
              {tr('Se déconnecter')}
            </span>
            <Icon name="back" className="size-4 rotate-180 text-d-muted" />
          </button>
        </Card>
      </div>
    </>
  )
}
