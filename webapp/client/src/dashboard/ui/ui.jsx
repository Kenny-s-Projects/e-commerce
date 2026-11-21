/* eslint-disable react-refresh/only-export-components -- composants et petites fonctions liées, gardés ensemble */
// Petits composants communs aux dashboards (repris de la maquette)
import { BRANDS } from '../data/demo.js'
import { ORDER_STATUS, PART_STATUS, RIDER_STATUS } from '../lib/status.js'
import { initials } from '../lib/format.js'
import { tr } from '../lib/i18n.js'

/** Pastille de statut : point + libellé sur fond coloré */
export function Pill({ tone, children, className = '' }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ${className}`}
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children ?? tone.label}
    </span>
  )
}

export const StatusPill = ({ status, ...rest }) => <Pill tone={ORDER_STATUS[status]} {...rest} />
export const PartPill = ({ status, ...rest }) => <Pill tone={PART_STATUS[status]} {...rest} />
export const RiderPill = ({ status, ...rest }) => <Pill tone={RIDER_STATUS[status]} {...rest} />

/** Point de couleur + nom de la Maison */
export function Brand({ id, className = '' }) {
  const b = BRANDS[id]
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: b.color }} aria-hidden />
      {b.name}
    </span>
  )
}

export function Avatar({ name, className = 'size-10 text-[13px]', tone = 'bg-d-soft text-d-ink', color }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${tone} ${className}`} style={color ? { background: color } : undefined} aria-hidden>
      {initials(name)}
    </span>
  )
}

/** Carte blanche à bord fin */
export function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag className={`rounded-[14px] border border-d-line bg-white ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export function CardTitle({ children, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <h2 className="text-[17px] font-medium">{children}</h2>
      {action}
    </div>
  )
}

/** Boutons : plein (noir), contour, danger (contour rouge), discret (lien souligné) */
const BTN = {
  solid: 'bg-d-ink text-white hover:bg-black',
  outline: 'border border-d-ink bg-white text-d-ink hover:bg-d-soft',
  soft: 'border border-d-line bg-white text-d-ink hover:border-d-border',
  danger: 'border border-d-danger/70 bg-white text-d-danger hover:bg-[#f7deda]',
}
export function Button({ variant = 'solid', size = 'md', className = '', children, ...rest }) {
  const h = size === 'lg' ? 'h-14 text-[15px]' : size === 'sm' ? 'h-9 px-3.5 text-[13px]' : 'h-11 px-5 text-sm'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-normal transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 ${h} ${BTN[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function LinkButton({ className = '', children, ...rest }) {
  return (
    <button type="button" className={`text-[13px] underline decoration-d-border underline-offset-4 hover:decoration-d-ink ${className}`} {...rest}>
      {children}
    </button>
  )
}

/** Interrupteur (Boutique ouverte, Disponible) */
export function Toggle({ checked, onChange, label, className = '' }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`inline-flex items-center gap-3 ${className}`}>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-[#3f8a4f]' : 'bg-[#9b968c]'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] duration-300 ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </button>
  )
}

/** Titre de page : « Vue d’ensemble » avec un mot en italique */
export function PageTitle({ eyebrow, before, accent, after, live, className = '' }) {
  return (
    <div className={className}>
      {(eyebrow || live) && (
        <p className="mb-1.5 flex flex-wrap items-center gap-x-2 text-[13px] text-d-muted">
          {eyebrow}
          {live && (
            <span className="inline-flex items-center gap-1.5 text-[#2f6b40]">
              {eyebrow && <span className="text-d-muted">·</span>}
              <span className="size-2 animate-[livepulse_2s_ease-in-out_infinite] rounded-full bg-[#5e9468]" aria-hidden />
              {live === true ? tr('En direct') : live}
            </span>
          )}
        </p>
      )}
      <h1 className="text-[clamp(30px,3.4vw,38px)] font-light leading-[1.1] tracking-[-0.01em]">
        {before}
        {accent && <span className="font-serif italic">{accent}</span>}
        {after}
      </h1>
    </div>
  )
}

export const Mono = ({ className = '', children }) => <span className={`font-mono tabular-nums ${className}`}>{children}</span>

export const DemoNote = ({ children, className = '' }) => (
  <p className={`text-xs text-d-muted ${className}`}>{children ?? tr('Données de démonstration.')}</p>
)

/** Lien « tel: » et « WhatsApp » vers le client */
export const telHref = (phone) => `tel:${phone.replace(/\s/g, '')}`
export const waHref = (phone, text = '') => `https://wa.me/${phone.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`
