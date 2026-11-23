import { useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import useHashRoute, { HOME_HREF } from '../../hooks/useHashRoute.js'
import { contact } from '../../data/home.js'
import LangSwitch from '../LangSwitch/LangSwitch.jsx'
import { useT } from '../../i18n/lang.js'
import { brandOpen, useLive } from '../../data/live.js'

const ease = [0.22, 1, 0.36, 1]

// Sous-menu « Marques » : Patchi d'abord
const BRANDS = [
  { id: 'patchi', label: 'Patchi' },
  { id: 'kyra', label: 'Kyra' },
  { id: 'adidas', label: 'adidas' },
  { id: 'celio', label: 'Celio' },
]

const LINKS = [
  { label: 'Accueil', href: HOME_HREF, page: 'home' },
  { label: 'Marques', brands: true },
  { label: 'Offrir', href: '#offrir/pour-elle', page: 'offrir' },
  { label: 'Notre histoire', href: '#notre-histoire', page: 'histoire' },
  { label: 'Aide et service client', href: '#aide/livraison', page: 'aide' },
  { label: 'Suivre ma commande', href: '#suivi', page: 'suivi' },
  { label: 'Mon compte', href: '#compte', page: 'compte' },
]

/**
 * Panneau du menu, façon Haven : il se déplie depuis la pastille « Menu », en haut au centre.
 * Les liens arrivent l'un après l'autre ; un carré marque la page en cours ;
 * téléphone et e-mail en bas. Fermeture : croix, clic à côté, Échap ou clic sur un lien.
 * « Marques » s'ouvre en accordéon (Patchi, Kyra, adidas, Celio) ; ouvert d'office sur une page de Maison.
 *  open · onClose · onSearch (ouvre la recherche à la place du menu)
 */
export default function MenuPanel({ open, onClose, onSearch }) {
  const t = useT()
  const route = useHashRoute()
  const current = route.page === 'maison' ? `maison-${route.id}` : ['inscription', 'code', 'profil'].includes(route.page) ? 'compte' : route.page

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t('Menu')}>
          {/* Clic à côté : ferme */}
          <m.button
            type="button"
            aria-label={t('Fermer le menu')}
            className="absolute inset-0 cursor-default bg-ink/20"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />

          <m.nav
            id="menu-panel"
            className="absolute left-1/2 top-3 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-lg bg-ink px-7 pb-8 pt-5 text-cream shadow-[0_40px_80px_rgba(0,0,0,0.35)]"
            initial={{ clipPath: 'inset(0% 0% 92% 0% round 8px)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 8px)' }}
            exit={{ clipPath: 'inset(0% 0% 92% 0% round 8px)', transition: { duration: 0.45, ease } }}
            transition={{ duration: 0.7, ease }}
          >
            {/* En-tête : « Menu » + croix (les deux traits se croisent) */}
            <div className="flex items-center justify-between">
              <span className="text-[14px]">{t('Menu')}</span>
              <button type="button" onClick={onClose} aria-label={t('Fermer')} className="relative grid h-8 w-[60px] place-items-center">
                <m.span className="absolute h-px w-full bg-current" initial={{ rotate: 0, y: -3 }} animate={{ rotate: 10, y: 0 }} transition={{ duration: 0.5, ease }} />
                <m.span className="absolute h-px w-full bg-current" initial={{ rotate: 0, y: 3 }} animate={{ rotate: -10, y: 0 }} transition={{ duration: 0.5, ease }} />
              </button>
            </div>

            <m.ul
              className="mt-5"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
            >
              {LINKS.map((l) => {
                if (l.brands)
                  return (
                    <m.li
                      key={l.label}
                      className="border-b border-cream/15 last:border-0"
                      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
                    >
                      <BrandsMenu current={current} onClose={onClose} />
                    </m.li>
                  )
                const on = l.page === current
                return (
                  <m.li
                    key={l.label}
                    className="border-b border-cream/15 last:border-0"
                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
                  >
                    <a
                      href={l.href}
                      onClick={onClose}
                      aria-current={on ? 'page' : undefined}
                      className="group flex items-center gap-3 py-[15px] text-[18px] transition-[padding] duration-400 ease-lux hover:pl-2"
                    >
                      {on && <span aria-hidden className="size-[7px] bg-gold" />}
                      {t(l.label)}
                    </a>
                  </m.li>
                )
              })}
            </m.ul>

            <m.div
              className="mt-7 flex flex-col gap-3 text-[13px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <button type="button" onClick={onSearch} className="flex items-center gap-2 text-left hover:text-gold">
                {t('Rechercher un produit')} ⟶
              </button>
              <a href={contact.phoneHref ?? `tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-gold">{contact.phone} ↗</a>
              <a href={`mailto:${contact.email}`} className="break-all hover:text-gold">{contact.email} ↗</a>
              <LangSwitch className="caps mt-3 text-[11px]" />
            </m.div>
          </m.nav>
        </div>
      )}
    </AnimatePresence>
  )
}

/** « Marques » ▾ : accordéon avec les quatre Maisons ; « Bientôt » pour une Maison pas encore ouverte à la vente */
function BrandsMenu({ current, onClose }) {
  const t = useT()
  const live = useLive()
  const inBrand = current.startsWith('maison-')
  const [open, setOpen] = useState(inBrand)
  const known = live.status === 'ready'

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-brands"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 py-[15px] text-left text-[18px] transition-[padding] duration-400 ease-lux hover:pl-2"
      >
        {inBrand && !open && <span aria-hidden className="size-[7px] bg-gold" />}
        {t('Marques')}
        <m.span aria-hidden className="ml-auto text-[14px]" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.4, ease }}>
          ▾
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.ul
            id="menu-brands"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            {BRANDS.map((b, i) => {
              const on = current === `maison-${b.id}`
              return (
                <m.li key={b.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease, delay: 0.05 * i }}>
                  <a
                    href={`#maison/${b.id}`}
                    onClick={onClose}
                    aria-current={on ? 'page' : undefined}
                    className="flex items-center gap-3 py-2.5 pl-5 text-[16px] text-cream/85 transition-[padding,color] duration-400 ease-lux last:pb-4 hover:pl-7 hover:text-cream"
                  >
                    {on && <span aria-hidden className="size-[6px] bg-gold" />}
                    {b.label}
                    {known && !brandOpen(b.id) && <span className="caps ml-auto text-[9px] text-cream/50">{t('Bientôt')}</span>}
                  </a>
                </m.li>
              )
            })}
          </m.ul>
        )}
      </AnimatePresence>
    </>
  )
}
