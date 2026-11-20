import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Bandeau services de l'accueil : 4 engagements, chacun avec une icône au trait,
 * une ligne normale et une ligne en gras. Fond crème, icônes encre, détail doré au survol.
 * Ordinateur : 4 colonnes · tablette et mobile : 2 × 2.
 *  items : [{ icon, line, bold, href? }] (voir data/home.js)
 */
export default function Services({ items }) {
  const t = useT()
  return (
    <section className="px-gutter py-[clamp(24px,3vw,40px)]">
      <m.ul
        className="mx-auto grid max-w-[1200px] grid-cols-4 rounded-2xl bg-cream px-[clamp(12px,3vw,48px)] py-[clamp(28px,3.4vw,44px)] text-ink max-[900px]:grid-cols-2 max-[900px]:gap-y-8"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {items.map((item) => {
          const Tag = item.href ? 'a' : 'div'
          return (
            <m.li
              key={item.icon}
              className="flex justify-center"
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }}
            >
              <Tag
                {...(item.href ? { href: item.href, target: '_blank', rel: 'noreferrer' } : {})}
                className="group flex max-w-[220px] flex-col items-center gap-3 px-2 text-center"
              >
                <span className="grid size-12 place-items-center transition-transform duration-500 ease-lux group-hover:-translate-y-1">
                  <Icon name={item.icon} />
                </span>
                <span className="text-[13px] leading-snug max-sm:text-[12px]">
                  {t(item.line)}
                  <br />
                  <strong className={`font-medium ${item.href ? 'border-b border-ink/30 transition-colors group-hover:border-gold' : ''}`}>{t(item.bold)}</strong>
                </span>
              </Tag>
            </m.li>
          )
        })}
      </m.ul>
    </section>
  )
}

// Icônes au trait (même épaisseur que le sac du panier)
function Icon({ name }) {
  const common = { viewBox: '0 0 40 40', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'size-10', 'aria-hidden': true }
  if (name === 'delivery')
    return (
      <svg {...common}>
        <path d="M16 14h16l-1.5 18h-13L16 14Z" />
        <path d="M20 14v-2.5a4 4 0 0 1 8 0V14" />
        <path d="M5 19h7M7 23h5M9 27h3" className="text-gold" stroke="currentColor" />
      </svg>
    )
  if (name === 'store')
    return (
      <svg {...common}>
        <path d="M7 16h26v16H7z" />
        <path d="M5 16l3-7h24l3 7" />
        <path d="M5 16c0 2 1.6 3.5 3.5 3.5S12 18 12 16c0 2 1.6 3.5 3.5 3.5S19 18 19 16c0 2 1.6 3.5 3.5 3.5S26 18 26 16c0 2 1.6 3.5 3.5 3.5S33 18 33 16" />
        <path d="M17 32v-7h6v7" className="text-gold" stroke="currentColor" />
      </svg>
    )
  if (name === 'payment')
    return (
      <svg {...common}>
        <rect x="5" y="11" width="22" height="15" rx="2" />
        <path d="M5 16h22" />
        <rect x="23" y="17" width="12" height="17" rx="2" />
        <path d="M27.5 31h3" className="text-gold" stroke="currentColor" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M8 29V12a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H13l-5 3Z" />
      <path d="M14 16.5h12M14 20.5h8" className="text-gold" stroke="currentColor" />
    </svg>
  )
}
