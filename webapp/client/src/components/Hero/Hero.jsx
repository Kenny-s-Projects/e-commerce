import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '../../data/houses.js'
import './Hero.css'

const ease = [0.22, 1, 0.36, 1]
const AUTOPLAY_MS = 5000

export default function Hero({ houses }) {
  const [active, setActive] = useState(houses.length - 1) // Celio ouvert, comme la maquette
  const [paused, setPaused] = useState(false)

  // La colonne ouverte change toute seule tant que la souris n'est pas sur le hero
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive((i) => (i + 1) % houses.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [paused, houses.length])

  return (
    <section
      className="hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {houses.map((house, i) => (
        <HeroColumn
          key={house.id}
          house={house}
          index={i}
          isActive={i === active}
          onActivate={() => setActive(i)}
        />
      ))}

      <motion.p
        className="hero__caption caps"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease }}
      >
        Quatre maisons, une seule adresse
      </motion.p>
    </section>
  )
}

function HeroColumn({ house, index, isActive, onActivate }) {
  const { hero } = house

  return (
    <motion.article
      className={`hero__col hero__col--${house.theme} ${isActive ? 'is-active' : ''}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      tabIndex={0}
      animate={{ flexGrow: isActive ? 2.2 : 1 }}
      transition={{ duration: 0.9, ease }}
    >
      {/* Rideau : chaque colonne se dévoile du bas vers le haut, l'une après l'autre */}
      <motion.div
        className="hero__curtain"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 1.1, delay: 0.15 * index, ease }}
      />

      <header className="hero__top">
        <span className="hero__index caps">{String(index + 1).padStart(2, '0')}</span>
        {house.logo ? (
          <img className={`hero__logo hero__logo--${house.id}`} src={house.logo} alt={house.name} />
        ) : (
          <span className="hero__wordmark">{house.name}</span>
        )}
      </header>

      <motion.div
        className="hero__visual"
        animate={{ scale: isActive ? 1.08 : 1 }}
        transition={{ duration: 0.9, ease }}
      >
        {hero.img ? (
          <img
            src={hero.img}
            alt={hero.name}
            className={hero.boxed ? 'hero__box' : 'hero__img'}
          />
        ) : (
          <div className="hero__placeholder caps">Photo produit<br />à venir</div>
        )}
      </motion.div>

      <footer className="hero__bottom">
        <p className="hero__tagline caps">{house.tagline}</p>

        <AnimatePresence>
          {isActive && (
            <motion.div
              className="hero__details"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.6, delay: 0.35, ease }}
            >
              <p className="hero__name">{hero.name}</p>
              <p className="hero__price">{formatPrice(hero.price)}</p>
              <a href={`#${house.id}`} className="hero__cta caps">
                Entrer chez {house.name} <span aria-hidden>⟶</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </motion.article>
  )
}