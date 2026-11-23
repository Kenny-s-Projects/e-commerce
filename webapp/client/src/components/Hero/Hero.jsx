import { useEffect, useRef, useState } from 'react'
import { m, AnimatePresence, useInView } from 'framer-motion'
import { formatPrice, maisonHref } from '../../data/houses.js'
import { useLive } from '../../data/live.js'
import { heroThemes } from '../../data/themes.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]
const AUTOPLAY_MS = 15_000 // la colonne suivante s'agrandit toute seule après 15 s

export default function Hero({ houses, ready = true }) {
  const t = useT()
  const [active, setActive] = useState(houses.length - 1) // Celio ouvert, comme la maquette
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { amount: 0.3 })

  // Toutes les 15 s, la colonne suivante s'agrandit (Kyra → Patchi → adidas → Celio → …).
  // Le survol d'une colonne l'agrandit et relance les 15 s (active change → le minuteur repart).
  // Pas de pause au survol : le hero remplit l'écran, la souris est presque toujours dessus.
  useEffect(() => {
    if (!ready || !inView) return
    const timer = setTimeout(() => setActive((i) => (i + 1) % houses.length), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [active, ready, inView, houses.length])

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[calc(100svh-4rem)] min-h-[560px] overflow-hidden max-md:grid max-md:h-auto max-md:min-h-0 max-md:grid-cols-2 max-md:bg-beige"
    >
      {houses.map((house, i) => (
        <HeroColumn
          key={house.id}
          house={house}
          index={i}
          ready={ready}
          isActive={i === active}
          onActivate={() => setActive(i)}
        />
      ))}

      <m.p
        className="caps pointer-events-none absolute bottom-[22px] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-white mix-blend-difference max-md:static max-md:col-span-2 max-md:translate-x-0 max-md:py-5 max-md:text-center max-md:text-ink max-md:mix-blend-normal"
        initial={{ opacity: 0, y: 10 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 1.2, ease }}
      >
        {t('Quatre maisons, une seule adresse')}
      </m.p>
    </section>
  )
}

// Produit vedette tiré du catalogue réel (hero.slug) : nom, prix et photo de l'API dès qu'ils arrivent
function useHeroProduct(hero) {
  const live = useLive()
  if (!hero.slug) return { ...hero, pending: false }
  const p = live.bySlug.get(hero.slug)
  if (!p) return { ...hero, pending: live.status === 'idle' || live.status === 'loading' }
  return { ...hero, name: p.name, price: p.price, img: p.hasPhoto ? p.img : hero.img, href: `#produit/${p.slug}`, live: true, pending: false }
}

function HeroColumn({ house, index, ready, isActive, onActivate }) {
  const hero = useHeroProduct(house.hero)
  const t = useT()

  return (
    <m.article
      className={`relative flex min-w-0 flex-[1_1_0] cursor-pointer flex-col px-[clamp(16px,2vw,32px)] pb-14 pt-10 outline-none max-md:min-h-[46vh] max-md:px-4 max-md:pb-6 max-md:pt-5 ${heroThemes[house.theme]}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      tabIndex={0}
      // La largeur change d'un coup (flex-grow), Framer Motion anime le passage en transform (FLIP) :
      // une seule mesure par changement au lieu d'un recalcul de mise en page à chaque image.
      layout
      style={{ flexGrow: isActive ? 2.2 : 1 }}
      transition={{ layout: { duration: 0.9, ease } }}
    >
      {/* Rideau : chaque colonne se dévoile l'une après l'autre, une fois le préchargeur parti */}
      <m.div
        className="pointer-events-none absolute inset-0 z-[5] origin-top bg-beige"
        initial={{ scaleY: 1 }}
        animate={ready ? { scaleY: 0 } : {}}
        transition={{ duration: 1.1, delay: 0.3 + 0.15 * index, ease }}
      />


      <m.header layout="position" transition={{ layout: { duration: 0.9, ease } }} className="flex items-start justify-between gap-3">
        <span className="caps opacity-70">{String(index + 1).padStart(2, '0')}</span>
        {house.logo ? (
          <img
            decoding="async"
            src={house.logo}
            alt={house.name}
            className={
              house.id === 'celio'
                ? 'mt-1.5 h-[clamp(16px,1.5vw,22px)] w-auto'
                : 'h-[clamp(26px,2.6vw,38px)] w-20 object-contain'
            }
          />
        ) : (
          <span className="text-[clamp(28px,2.8vw,42px)] font-light leading-[0.8] tracking-tight">
            {house.name}
          </span>
        )}
      </m.header>

      {/* Visuel */}
      <m.div
        layout="position"
        className="grid min-h-0 flex-1 place-items-center py-6"
        animate={{ scale: isActive ? 1.08 : 1 }}
        transition={{ duration: 0.9, ease, layout: { duration: 0.9, ease } }}
      >
        {hero.img ? (
          <img
            src={hero.img}
            alt={t(hero.name)}
            decoding="async"
            fetchPriority={isActive ? 'high' : 'auto'}
            className={
              hero.boxed
                ? 'aspect-square w-[min(70%,220px)] object-cover shadow-[0_30px_60px_rgba(0,0,0,0.18)] '
                : 'max-h-[52vh] w-auto max-w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.22)] max-md:max-h-[26vh]  '
            }
          />
        ) : (
          <div
            className={`caps grid aspect-[4/5] place-items-center border border-dashed border-current text-center text-[8px] leading-[1.8] opacity-60 ${
              house.theme === 'black' ? 'w-[min(60%,160px)]' : 'w-[min(80%,280px)]'
            }`}
          >
            {t('Photo produit')}<br />{t('à venir')}
          </div>
        )}
      </m.div>


      <m.footer layout="position" transition={{ layout: { duration: 0.9, ease } }} className="min-h-[110px] max-md:min-h-0">
        <p className="caps max-w-[180px] leading-[1.7]">{t(house.tagline)}</p>

        <AnimatePresence>
          {isActive && (
            <m.div
              className="mt-1 max-md:hidden"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.6, delay: 0.35, ease }}
            >
              {/* Produit vedette (catalogue réel) : nom + prix réel ; squelette pendant le chargement 
              {hero.slug && (
                <p className="mt-0.5 text-[15px]">
                  {hero.href ? <a href={hero.href} className="hover:underline hover:underline-offset-4">{t(hero.name)}</a> : t(hero.name)}
                  <span className="mt-0.5 block h-[18px] text-[13px] opacity-75">
                    {hero.pending ? <span aria-hidden className="sk inline-block h-3 w-14 rounded-full align-middle" /> : hero.live && hero.price != null ? formatPrice(hero.price) : null}
                  </span>
                </p>
              )}*/}
              <a
                href={maisonHref(house.id)}
                className="caps group mt-3.5 inline-flex items-center gap-2.5 whitespace-nowrap border-b border-current pb-1.5"
              >
                {t('Entrer chez {m}', { m: house.name })}
                <span aria-hidden className="transition-transform duration-400 ease-lux group-hover:translate-x-1.5">
                  ⟶ 
                </span>
              </a>
            </m.div>
          )}
        </AnimatePresence>
      </m.footer>
    </m.article>
  )
}
