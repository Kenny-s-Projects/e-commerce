import { useRef } from 'react'
import { m, useMotionValue, useScroll, useTransform } from 'framer-motion'
import useLiteMode from '../../hooks/useLiteMode.js'
import Praline from '../../components/maison/Praline.jsx'
import { patchiFlavors, patchiPage } from '../../data/maisonPages.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]
const SLOTS = 12 // pralines visibles dans le coffret (4 × 3)

/**
 * Hero Patchi : la découverte du coffret, pilotée par le défilement.
 * La section est 4 fois plus haute que l'écran ; l'image reste fixe pendant qu'on descend :
 *   1. le coffret fermé, légèrement incliné  →  2. le ruban se dénoue
 *   3. le couvercle se soulève et bascule     →  4. les pralines apparaissent une à une
 *   5. zoom sur le coffret, puis la phrase de la Maison.
 * Avec « réduire les animations », le coffret est montré ouvert, sans défilement piloté.
 */
export default function BoxReveal({ onCompose, composeLabel = 'Composer un coffret' }) {
  const t = useT()
  const ref = useRef(null)
  const reduce = useLiteMode() // mode léger ou « Réduire les animations »
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const still = useMotionValue(0.95)
  const p = reduce ? still : scrollYProgress
  const { hero } = patchiPage

  // Coffret : inclinaison au départ, à plat une fois ouvert, puis zoom
  const tilt = useTransform(p, [0, 0.55], [32, 0])
  const scale = useTransform(p, [0, 0.12, 0.6, 0.88], [0.86, 1, 1, 1.18])
  const boxY = useTransform(p, [0.84, 1], [0, -30])

  // Ruban : il se dénoue
  const ribbon = useTransform(p, [0.12, 0.28], [1, 0])
  const bow = useTransform(p, [0.1, 0.24], [1, 0])
  const bowSpin = useTransform(p, [0.1, 0.24], [0, 120])

  // Couvercle : il se soulève, bascule en arrière puis disparaît
  const lidRot = useTransform(p, [0.28, 0.54], [0, -110])
  const lidY = useTransform(p, [0.28, 0.58], ['0%', '-22%'])
  const lidOpacity = useTransform(p, [0.5, 0.6], [1, 0])

  // Textes qui se relaient
  const c0 = useTransform(p, [0, 0.2, 0.26], [1, 1, 0])
  const c1 = useTransform(p, [0.27, 0.33, 0.5, 0.56], [0, 1, 1, 0])
  const c2 = useTransform(p, [0.57, 0.63, 0.78, 0.83], [0, 1, 1, 0])
  const finale = useTransform(p, [0.84, 0.93], [0, 1])
  const finaleY = useTransform(p, [0.84, 0.93], [30, 0])
  const cue = useTransform(p, [0, 0.06], [1, 0])

  const captions = [c0, c1, c2]

  return (
    <section ref={ref} className={`relative bg-forest-deep text-paper ${reduce ? '' : 'h-[400vh]'}`}>
      <div className={`${reduce ? 'relative' : 'sticky top-16'} flex h-[calc(100svh-4rem)] min-h-[600px] flex-col overflow-hidden px-gutter pb-8 pt-6`}>
        {/* Étiquettes du haut */}
        <m.div
          className="caps relative z-20 flex justify-between gap-4 text-gold max-sm:text-[8px]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
        >
          {hero.labels.map((l) => (
            <span key={l} className="max-sm:[&:nth-child(2)]:hidden">{t(l)}</span>
          ))}
        </m.div>

        {/* Le coffret */}
        <div className="relative z-10 grid flex-1 place-items-center [perspective:1400px]">
          <m.div
            className="relative aspect-[4/3] w-[min(72vw,540px)] max-sm:w-[84vw]"
            style={{ rotateX: tilt, scale, y: boxY, transformStyle: 'preserve-3d' }}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.2, ease }}
          >
            {/* Fond du coffret + pralines */}
            <div className="absolute inset-0 rounded-[18px] bg-green p-[5%] shadow-[0_50px_100px_rgba(0,0,0,0.45)]">
              <div className="grid size-full grid-cols-4 grid-rows-3 gap-[3%] rounded-[10px] bg-paper p-[4%]">
                {Array.from({ length: SLOTS }, (_, i) => (
                  <BoxPraline key={i} index={i} p={p} />
                ))}
              </div>
            </div>

            {/* Couvercle, articulé sur son bord haut */}
            <m.div
              className="absolute inset-0 grid origin-top place-items-center rounded-[18px] bg-green shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
              style={{ rotateX: lidRot, y: lidY, opacity: lidOpacity, backfaceVisibility: 'hidden' }}
            >
              <span className="absolute inset-[4%] rounded-[12px] border border-gold/70" />
              <img decoding="async" src="/img/logos/patchi.png" alt="Patchi" className="relative w-[38%]" />

              {/* Ruban vertical et horizontal */}
              <m.span className="absolute inset-y-0 left-[18%] w-[8%] -translate-x-1/2 origin-center bg-[linear-gradient(90deg,#b8954f,#e8cf8f,#b8954f)]" style={{ scaleY: ribbon }} />
              <m.span className="absolute inset-x-0 top-[24%] h-[10%] -translate-y-1/2 origin-center bg-[linear-gradient(180deg,#b8954f,#e8cf8f,#b8954f)]" style={{ scaleX: ribbon }} />
              {/* Nœud */}
              <m.span className="absolute left-[18%] top-[24%] flex -translate-x-1/2 -translate-y-1/2 gap-1" style={{ scale: bow, rotate: bowSpin }}>
                <span className="block h-[clamp(28px,4vw,44px)] w-[clamp(42px,6vw,66px)] -rotate-12 rounded-[50%_30%_30%_50%] bg-[radial-gradient(circle_at_70%_50%,#e8cf8f,#b8954f)] shadow-md" />
                <span className="block h-[clamp(28px,4vw,44px)] w-[clamp(42px,6vw,66px)] rotate-12 rounded-[30%_50%_50%_30%] bg-[radial-gradient(circle_at_30%_50%,#e8cf8f,#b8954f)] shadow-md" />
              </m.span>
            </m.div>
          </m.div>
        </div>

        {/* Textes sous le coffret */}
        <div className="relative z-20 h-[clamp(120px,16vh,170px)] text-center">
          {hero.captions.map((c, i) => (
            <m.p
              key={c}
              className="accent absolute inset-x-0 top-0 text-[clamp(30px,3.6vw,52px)] leading-tight"
              style={{ opacity: captions[i] }}
            >
              {t(c)}
            </m.p>
          ))}

          <m.div className="absolute inset-x-0 top-0 flex flex-col items-center" style={{ opacity: finale, y: finaleY }}>
            <p className="text-[clamp(24px,2.6vw,36px)] font-light leading-tight">
              {t(hero.title)} <span className="accent text-[1.08em]">{t(hero.accent)}</span>
            </p>
            <p className="mt-2 max-w-[520px] text-[14px] leading-[1.7] text-paper/80">{t(hero.text)}</p>
            <button type="button" onClick={onCompose} className="caps mt-4 border-b border-gold pb-1.5">
              {t(composeLabel)} ⟶
            </button>
          </m.div>

          {!reduce && (
            <m.div className="caps absolute inset-x-0 bottom-0 flex flex-col items-center gap-2.5 text-paper/80" style={{ opacity: cue }}>
              {t('Faites défiler pour ouvrir le coffret')}
              <span className="block h-9 w-px overflow-hidden bg-current/30">
                <span className="block h-1/3 w-full animate-scroll-cue bg-current" />
              </span>
            </m.div>
          )}
        </div>
      </div>
    </section>
  )
}

// Une praline du coffret : elle apparaît à son tour quand le couvercle se lève
function BoxPraline({ index, p }) {
  const start = 0.36 + index * 0.014
  const scale = useTransform(p, [start, start + 0.08], [0.4, 1])
  const opacity = useTransform(p, [start, start + 0.05], [0, 1])
  const flavor = patchiFlavors[index % patchiFlavors.length]
  return (
    <m.div className="grid place-items-center" style={{ scale, opacity }}>
      <Praline choco={flavor.choco} cup className="size-full max-h-full" />
    </m.div>
  )
}
