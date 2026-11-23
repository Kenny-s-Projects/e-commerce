import { useEffect, useRef, useState } from 'react'
import { animate, m, useMotionValue, useTransform } from 'framer-motion'
import useLiteMode from '../../hooks/useLiteMode.js'
import Praline from '../../components/maison/Praline.jsx'
import { patchiFlavors, patchiPage } from '../../data/maisonPages.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]
const SLOTS = 12 // pralines visibles dans le coffret (4 × 3)
const OPEN_MS = 1800 // durée de l'ouverture
const OPEN_KEYS = ['ArrowDown', 'PageDown', ' ', 'Spacebar', 'End']

/**
 * Hero Patchi : le coffret s'ouvre en un seul geste.
 * Au premier défilement (molette, doigt, clavier) ou au clic sur le coffret, l'ouverture se joue
 * d'elle-même en 1,8 s ; la page reste en place pendant ce temps, puis le défilement reprend normalement :
 *   1. le coffret fermé, légèrement incliné  →  2. le ruban se dénoue
 *   3. le couvercle se soulève et bascule     →  4. les pralines apparaissent une à une
 *   5. zoom sur le coffret, puis la phrase de la Maison.
 * Bouton « Découvrir les chocolats » toujours visible, mis en avant une fois le coffret ouvert.
 * Mode léger ou « Réduire les animations » : coffret montré ouvert, sans animation.
 */
export default function BoxReveal({ onCompose, composeLabel = 'Composer un coffret' }) {
  const t = useT()
  const ref = useRef(null)
  const reduce = useLiteMode() // mode léger ou « Réduire les animations »
  // Arrivée au milieu de la page (retour arrière, ancre) : coffret déjà ouvert
  const [startOpen] = useState(() => typeof window !== 'undefined' && window.scrollY > 40)
  const progress = useMotionValue(startOpen ? 1 : 0)
  const still = useMotionValue(0.95)
  const p = reduce ? still : progress
  const [state, setState] = useState(startOpen ? 'open' : 'closed') // closed → opening → open
  const { hero } = patchiPage

  // Ouverture : une seule fois ; pendant l'animation, la page ne défile pas
  useEffect(() => {
    if (reduce || startOpen) return
    let phase = 'closed'
    let touchY = null
    const open = () => {
      if (phase !== 'closed') return
      phase = 'opening'
      setState('opening')
      animate(progress, 1, { duration: OPEN_MS / 1000, ease: [0.45, 0, 0.2, 1] }).then(() => {
        phase = 'open'
        setState('open')
      })
    }
    const atTop = () => window.scrollY < 40
    const onWheel = (e) => {
      if (phase === 'opening') return e.preventDefault()
      if (phase === 'closed' && atTop() && e.deltaY > 0) {
        e.preventDefault()
        open()
      }
    }
    const onTouchStart = (e) => {
      touchY = e.touches[0]?.clientY ?? null
    }
    const onTouchMove = (e) => {
      if (phase === 'opening') return e.preventDefault()
      const y = e.touches[0]?.clientY
      if (phase === 'closed' && atTop() && touchY != null && y != null && touchY - y > 8) {
        e.preventDefault()
        open()
      }
    }
    const onKey = (e) => {
      if (!OPEN_KEYS.includes(e.key) || e.target.closest?.('input, textarea, select, [contenteditable]')) return
      if (phase === 'opening' || (phase === 'closed' && atTop())) {
        e.preventDefault()
        open()
      }
    }
    const el = ref.current
    const onClick = (e) => e.target.closest?.('[data-box]') && open()
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)
    el?.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      el?.removeEventListener('click', onClick)
    }
  }, [reduce, startOpen, progress])

  const opened = reduce || state === 'open'

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
  // Textes : « Un coffret se reçoit. » puis, coffret ouvert, la phrase de la Maison
  const c0 = useTransform(p, [0, 0.18], [1, 0])
  const finale = useTransform(p, [0.8, 0.95], [0, 1])
  const finaleY = useTransform(p, [0.8, 0.95], [24, 0])

  return (
    <section ref={ref} className="relative bg-forest-deep text-paper">
      <div className="relative flex h-[calc(100svh-4rem)] min-h-[600px] flex-col overflow-hidden px-gutter pb-8 pt-6">
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
            data-box
            className={`relative aspect-[4/3] w-[min(72vw,540px)] max-sm:w-[84vw] ${opened ? '' : 'cursor-pointer'}`}
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

        {/* Textes sous le coffret, puis le bouton (toujours visible) */}
        <div className="relative z-20 flex flex-col items-center text-center">
          <div className="relative h-[clamp(96px,13vh,130px)] w-full">
            <m.div className="absolute inset-x-0 top-0 flex flex-col items-center" style={{ opacity: c0 }}>
              <p className="accent text-[clamp(30px,3.6vw,52px)] leading-tight">{t(hero.captions[0])}</p>
              {!reduce && <p className="caps mt-3 text-paper/70">{t('Faites défiler pour ouvrir le coffret')}</p>}
            </m.div>
            <m.div className="absolute inset-x-0 top-0 flex flex-col items-center" style={{ opacity: finale, y: finaleY }}>
              <p className="text-[clamp(24px,2.6vw,36px)] font-light leading-tight">
                {t(hero.title)} <span className="accent text-[1.08em]">{t(hero.accent)}</span>
              </p>
              <p className="mt-2 max-w-[520px] text-[14px] leading-[1.7] text-paper/80 max-sm:text-[13px]">{t(hero.text)}</p>
            </m.div>
          </div>

          <m.button
            type="button"
            onClick={onCompose}
            className="caps relative mt-2 inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 text-[12px] font-medium text-forest-deep shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-colors hover:bg-[#e8cf8f]"
            animate={opened ? { scale: [1, 1.08, 1], boxShadow: ['0 10px 30px rgba(0,0,0,0.3)', '0 0 0 10px rgba(201,169,106,0.35)', '0 10px 30px rgba(0,0,0,0.3)'] } : { scale: 1 }}
            transition={{ duration: 0.9, ease }}
            whileTap={{ scale: 0.96 }}
          >
            {t(composeLabel)}
            <span aria-hidden className="text-[15px]">⟶</span>
          </m.button>
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
