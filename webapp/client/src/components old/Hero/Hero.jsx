import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '../../data/houses.js'
import { heroThemes } from '../../data/themes.js'

const ease = [0.22, 1, 0.36, 1]
const AUTOPLAY_MS = 5000

export default function Hero({ houses, ready = true }) {
  const [active, setActive] = useState(houses.length - 1) // Celio ouvert, comme la maquette
  const [paused, setPaused] = useState(false)

  // La colonne ouverte change toute seule tant que la souris n'est pas sur le hero
  useEffect(() => {
    if (paused || !ready) return
    const t = setInterval(() => setActive((i) => (i + 1) % houses.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [paused, ready, houses.length])

  return (
    <section
      className="relative flex h-screen min-h-[620px] overflow-hidden max-md:grid max-md:h-auto max-md:min-h-0 max-md:grid-cols-2 max-md:bg-beige max-md:pt-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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

      <motion.p
        className="caps pointer-events-none absolute bottom-[22px] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-white mix-blend-difference max-md:static max-md:col-span-2 max-md:translate-x-0 max-md:py-5 max-md:text-center max-md:text-ink max-md:mix-blend-normal"
        initial={{ opacity: 0, y: 10 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 1.2, ease }}
      >
        Quatre maisons, une seule adresse
      </motion.p>
    </section>
  )
}

function HeroColumn({ house, index, ready, isActive, onActivate }) {
  const { hero } = house

  return (
    <motion.article
      className={`relative flex min-w-0 flex-[1_1_0] cursor-pointer flex-col px-[clamp(16px,2vw,32px)] pb-16 pt-24 outline-none max-md:min-h-[46vh] max-md:px-4 max-md:pb-6 max-md:pt-5 ${heroThemes[house.theme]}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      tabIndex={0}
      animate={{ flexGrow: isActive ? 2.2 : 1 }}
      transition={{ duration: 0.9, ease }}
    >
      {/* Rideau : chaque colonne se dévoile l'une après l'autre, une fois le préchargeur parti */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[5] origin-top bg-beige"
        initial={{ scaleY: 1 }}
        animate={ready ? { scaleY: 0 } : {}}
        transition={{ duration: 1.1, delay: 0.3 + 0.15 * index, ease }}
      />

      {/* Haut : numéro + logo */}
      <header className="flex items-start justify-between gap-3">
        <span className="caps opacity-70">{String(index + 1).padStart(2, '0')}</span>
        {house.logo ? (
          <img
            src={house.logo}
            alt={house.name}
            className={
              house.id === 'celio'
                ? 'mt-1.5 h-[clamp(16px,1.5vw,22px)] w-auto'
                : 'h-[clamp(26px,2.6vw,38px)] w-auto object-contain'
            }
          />
        ) : (
          <span className="text-[clamp(28px,2.8vw,42px)] font-light leading-[0.8] tracking-tight">
            {house.name}
          </span>
        )}
      </header>

      {/* Visuel */}
      <motion.div
        className="grid min-h-0 flex-1 place-items-center py-6"
        animate={{ scale: isActive ? 1.08 : 1 }}
        transition={{ duration: 0.9, ease }}
      >
        {hero.img ? (
          <img
            src={hero.img}
            alt={hero.name}
            className={
              hero.boxed
                ? 'aspect-square w-[min(70%,220px)] object-cover shadow-[0_30px_60px_rgba(0,0,0,0.18)]'
                : 'max-h-[52vh] w-auto max-w-full object-contain mix-blend-multiply max-md:max-h-[26vh]'
            }
          />
        ) : (
          <div
            className={`caps grid aspect-[4/5] place-items-center border border-dashed border-current text-center text-[8px] leading-[1.8] opacity-60 ${
              house.theme === 'black' ? 'w-[min(60%,160px)]' : 'w-[min(80%,280px)]'
            }`}
          >
            Photo produit<br />à venir
          </div>
        )}
      </motion.div>

      {/* Bas : catégorie + détails du produit quand la colonne est ouverte */}
      <footer className="min-h-[110px] max-md:min-h-0">
        <p className="caps max-w-[180px] leading-[1.7]">{house.tagline}</p>

        <AnimatePresence>
          {isActive && (
            <motion.div
              className="mt-1 max-md:hidden"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.6, delay: 0.35, ease }}
            >
              <p className="mt-0.5 text-[15px]">{hero.name}</p>
              <p className="mt-0.5 text-[13px] opacity-75">{formatPrice(hero.price)}</p>
              <a
                href={`#${house.id}`}
                className="caps group mt-3.5 inline-flex items-center gap-2.5 whitespace-nowrap border-b border-current pb-1.5"
              >
                Entrer chez {house.name}
                <span aria-hidden className="transition-transform duration-400 ease-lux group-hover:translate-x-1.5">
                  ⟶
                </span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </motion.article>
  )
}
