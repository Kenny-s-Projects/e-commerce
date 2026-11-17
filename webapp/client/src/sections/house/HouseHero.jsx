import { useEffect, useState } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import HouseMark from '../../components/HouseMark/HouseMark.jsx'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import { formatPrice } from '../../data/houses.js'

const ease = [0.22, 1, 0.36, 1]

/*
 * Position des tuiles flottantes (en % de l'écran), taille et profondeur.
 * depth : plus c'est grand, plus la tuile bouge avec la souris et le défilement (effet 3D).
 * m : position sur petit écran (tuiles gardées en haut et en bas, loin du texte).
 */
const TILES = [
  { x: 8, y: 15, size: 'clamp(84px,11.5vw,170px)', depth: 0.6, m: { x: 6, y: 11 } },
  { x: 36, y: 12, size: 'clamp(56px,7.5vw,110px)', depth: 0.3 },
  { x: 70, y: 13, size: 'clamp(96px,14vw,200px)', depth: 0.9, m: { x: 66, y: 9 } },
  { x: 84, y: 46, size: 'clamp(70px,10.5vw,150px)', depth: 0.5 },
  { x: 22, y: 57, size: 'clamp(96px,14.5vw,210px)', depth: 1, m: { x: 10, y: 74 } },
  { x: 4, y: 69, size: 'clamp(56px,8.3vw,120px)', depth: 0.35 },
  { x: 64, y: 65, size: 'clamp(84px,12.5vw,180px)', depth: 0.75, m: { x: 62, y: 70 } },
]

/**
 * Hero d'une page Maison : logo + phrase au centre, produits en tuiles flottantes autour.
 * Animations : les tuiles s'envolent du centre vers leur place, flottent en continu,
 * suivent la souris (profondeur) et remontent à des vitesses différentes au défilement.
 * Au survol d'une tuile : elle se soulève et affiche le nom et le prix du produit.
 */
export default function HouseHero({ house }) {
  const { shop } = house
  const isMobile = useMediaQuery('(max-width: 760px)')
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')

  // Souris : -0.5 → 0.5 sur chaque axe, lissé par un ressort
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 18 })
  const sy = useSpring(my, { stiffness: 60, damping: 18 })

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  const { scrollY } = useScroll()
  const centerY = useTransform(scrollY, [0, 700], [0, 120])
  const centerOpacity = useTransform(scrollY, [0, 500], [1, 0])

  // Produits montrés dans les tuiles (ceux qui ont une photo d'abord)
  const withImg = house.products.filter((p) => p.img)
  const pool = withImg.length ? withImg : house.products
  const tiles = TILES.filter((t) => !isMobile || t.m)
    .map((t) => (isMobile ? { ...t, ...t.m } : t))
    .map((t, i) => ({ ...t, product: pool[(i * 3) % pool.length] }))

  return (
    <section
      onMouseMove={canHover ? onMouseMove : undefined}
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-gutter pb-24 pt-28 ${shop.colors.hero}`}
    >
      {tiles.map((tile, i) => (
        <FloatingTile key={i} tile={tile} index={i} house={house} sx={sx} sy={sy} scrollY={scrollY} />
      ))}

      {/* Centre : logo, phrase, texte */}
      <motion.div
        className="pointer-events-none relative z-10 flex max-w-[560px] flex-col items-center text-center"
        style={{ y: centerY, opacity: centerOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.2, ease }}
        >
          <HouseMark
            house={house}
            className="h-[clamp(96px,13vw,190px)] max-w-[min(72vw,360px)]"
            textClass="text-[clamp(88px,12vw,180px)]"
          />
        </motion.div>

        <h1 className="mt-8 overflow-hidden text-[clamp(20px,2vw,28px)] font-light leading-snug">
          <motion.span
            className="block"
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1, delay: 0.7, ease }}
          >
            {shop.heroTitle.before} <span className="accent text-[1.1em]">{shop.heroTitle.accent}</span>
            {shop.heroTitle.after && (shop.heroTitle.after === '.' ? '.' : ` ${shop.heroTitle.after}`)}
          </motion.span>
        </h1>

        <motion.p
          className="mt-4 max-w-[380px] text-[13px] leading-[1.7] opacity-80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 0.9, delay: 1, ease }}
        >
          {shop.heroText}
        </motion.p>
      </motion.div>

      {canHover && (
        <motion.p
          className="caps absolute bottom-8 left-[clamp(20px,4vw,64px)] opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1, delay: 1.6 }}
        >
          Survolez un produit
        </motion.p>
      )}
    </section>
  )
}

function FloatingTile({ tile, index, house, sx, sy, scrollY }) {
  const { shop } = house
  const [hover, setHover] = useState(false)
  const [floatReady, setFloatReady] = useState(false)

  // Profondeur : souris (jusqu'à 40 px) + défilement (jusqu'à -260 px)
  const px = useTransform(sx, (v) => v * 80 * tile.depth)
  const py = useTransform(sy, (v) => v * 60 * tile.depth)
  const scrollShift = useTransform(scrollY, [0, 800], [0, -320 * tile.depth])
  const y = useTransform([py, scrollShift], ([a, b]) => a + b)

  // La flottaison démarre une fois la tuile arrivée à sa place
  useEffect(() => {
    const t = setTimeout(() => setFloatReady(true), 1400 + index * 90)
    return () => clearTimeout(t)
  }, [index])

  const { product } = tile
  const fitClass =
    product?.img && shop.fit === 'contain'
      ? 'absolute inset-0 m-auto size-[78%] object-contain mix-blend-multiply'
      : 'absolute inset-0 size-full object-cover'

  return (
    <motion.a
      href={product ? `#produit/${product.id}` : undefined}
      className="absolute z-0 block"
      style={{ left: `${tile.x}%`, top: `${tile.y}%`, width: tile.size, x: px, y }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Arrivée : depuis le centre de l'écran, en grandissant */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3, x: `${(50 - tile.x) * 4}%`, y: `${(50 - tile.y) * 4}%` }}
        animate={{ opacity: 1, scale: 1, x: '0%', y: '0%' }}
        transition={{ duration: 1.3, delay: 0.25 + index * 0.09, ease }}
      >
        {/* Flottaison continue, chaque tuile à son rythme */}
        <motion.div
          animate={floatReady ? { y: [0, -12, 0], rotate: [0, index % 2 ? 1.2 : -1.2, 0] } : {}}
          transition={{ duration: 5 + (index % 3), repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            className={`relative grid aspect-square place-items-center overflow-hidden rounded-[18%] border-[clamp(3px,0.45vw,7px)] shadow-[0_24px_50px_rgba(0,0,0,0.18)] ${shop.colors.tile}`}
            animate={{ scale: hover ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease }}
          >
            {product?.img ? (
              <img src={product.img} alt={product.name} className={fitClass} draggable={false} />
            ) : (
              <HouseMark house={house} className="h-[34%] max-w-[78%]" textClass="text-[clamp(16px,2vw,28px)]" />
            )}
          </motion.div>

          {/* Nom + prix au survol */}
          {product && (
            <motion.div
              className="pointer-events-none absolute left-1/2 top-full mt-3 w-max max-w-[200px] -translate-x-1/2 text-center"
              initial={false}
              animate={{ opacity: hover ? 1 : 0, y: hover ? 0 : -6 }}
              transition={{ duration: 0.35, ease }}
            >
              <p className="text-xs leading-snug">{product.name}</p>
              <p className="caps mt-1 text-[9px] opacity-70">{formatPrice(product.price, product.unit)}</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.a>
  )
}
