import { useState } from 'react'
import { AnimatePresence, m, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Reveal from '../../components/maison/Reveal.jsx'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Les icônes : présentoir à faire tourner (glisser à la souris ou au doigt),
 * changement de modèle animé, coloris et pointures.
 * La chaussure est une silhouette dessinée en attendant les photos 360° ou un modèle 3D.
 *  icons, colors, sizes : data/maisonPages.js
 */
export default function IconViewer({ icons, colors, sizes }) {
  const t = useT()
  const [index, setIndex] = useState(0)
  const [color, setColor] = useState(0)
  const [size, setSize] = useState(3)
  const [dir, setDir] = useState(1)

  // Rotation au glisser, avec un ressort pour l'inertie
  const spin = useMotionValue(0)
  const rotateY = useSpring(spin, { stiffness: 120, damping: 20 })
  const shadow = useTransform(rotateY, (v) => 0.75 + 0.25 * Math.abs(Math.cos((v * Math.PI) / 180)))

  const icon = icons[index]
  const c = colors[color]
  const go = (d) => {
    setDir(d)
    setIndex((i) => (i + d + icons.length) % icons.length)
    setColor(0)
    spin.set(0)
  }

  return (
    <section className="bg-black px-gutter pb-[clamp(80px,10vw,140px)] text-white">
      <div className="flex flex-wrap border border-white/10 bg-[radial-gradient(70%_70%_at_35%_50%,#2a2a2a_0%,#111_70%)]">
        {/* Présentoir */}
        <div className="relative grid min-h-[560px] min-w-0 flex-[999_1_560px] place-items-center overflow-hidden p-10 max-md:min-h-[400px]">
          <Reveal as="p" className="caps absolute left-7 top-6 text-white/60">
            {t('Les icônes')} · {String(index + 1).padStart(2, '0')} / {String(icons.length).padStart(2, '0')}
          </Reveal>

          <m.div
            className="relative w-[min(80%,560px)] cursor-grab touch-pan-y [perspective:1200px] active:cursor-grabbing"
            onPan={(_, info) => spin.set(spin.get() + info.delta.x * 0.8)}
            aria-label={t('Faire glisser pour tourner la chaussure')}
          >
            <AnimatePresence mode="popLayout" custom={dir} initial={false}>
              <m.div
                key={icon.name}
                custom={dir}
                variants={{
                  enter: (d) => ({ x: `${d * 60}%`, opacity: 0, rotate: d * 8 }),
                  center: { x: '0%', opacity: 1, rotate: 0 },
                  exit: (d) => ({ x: `${d * -60}%`, opacity: 0, rotate: d * -8 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.8, ease }}
              >
                <m.div style={{ rotateY }}>
                  <m.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                    <Sneaker colors={c} />
                  </m.div>
                </m.div>
              </m.div>
            </AnimatePresence>
            {/* Ombre au sol */}
            <m.span aria-hidden className="mx-auto mt-4 block h-5 w-[70%] rounded-[50%] bg-black/70 blur-md" style={{ scaleX: shadow }} />
          </m.div>

          <span className="caps absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-white/60">⟵ {t('Glisser pour tourner')} ⟶</span>
          <span className="caps absolute bottom-6 right-7 text-[9px] text-white/40 max-md:hidden">{t('[Photos 360° à fournir]')}</span>
        </div>

        {/* Fiche */}
        <div className="flex flex-[1_1_360px] flex-col gap-6 border-l border-white/10 p-9 max-md:border-l-0 max-md:border-t">
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} aria-label={t('Modèle précédent')} className="grid size-11 place-items-center border border-white transition-colors hover:bg-white/10">⟵</button>
            <button type="button" onClick={() => go(1)} aria-label={t('Modèle suivant')} className="grid size-11 place-items-center bg-white text-black">⟶</button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <m.div key={icon.name} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5, ease }}>
              <p className="caps text-white/60">{t(icon.who)} · {t('Chaussures')}</p>
              <h3 className="mt-2.5 text-[56px] font-medium uppercase leading-[0.95] tracking-[-0.03em]">{icon.name}</h3>
            </m.div>
          </AnimatePresence>

          <div>
            <p className="caps mb-2.5 text-white/60">{t('Coloris')} · {t(c.name)}</p>
            <div className="flex gap-2.5">
              {colors.map((col, i) => (
                <button
                  key={col.name}
                  type="button"
                  aria-label={t(col.name)}
                  aria-pressed={i === color}
                  onClick={() => setColor(i)}
                  className={`size-9 rounded-full border-2 outline outline-1 outline-white/25 transition-transform duration-300 hover:scale-110 ${i === color ? 'border-white' : 'border-transparent'}`}
                  style={{ background: col.upper }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="caps mb-2.5 text-white/60">{t('Pointure (EU)')}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {sizes.map((z, i) => (
                <button
                  key={z}
                  type="button"
                  aria-pressed={i === size}
                  onClick={() => setSize(i)}
                  className={`relative border py-3 text-[13px] ${i === size ? 'border-white text-black' : 'border-white/20 hover:border-white/60'}`}
                >
                  {i === size && <m.span layoutId="adidas-size" className="absolute inset-0 bg-white" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <span className="relative">{z}</span>
                </button>
              ))}
            </div>
            <a href="#taille" className="mt-2.5 inline-block text-[12px] text-white/75 underline underline-offset-4">{t('Guide des tailles')}</a>
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/15 pt-6">
            <span className="text-[28px] font-light">{t('[Prix]')}</span>
            <button type="button" disabled className="caps cursor-not-allowed bg-white/80 px-6 py-4 text-black" title={t('Prix à venir')}>
              {t('EU {s} · bientôt', { s: sizes[size] })}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Silhouette de chaussure (profil), aux couleurs du coloris choisi
function Sneaker({ colors }) {
  const t = useT()
  return (
    <svg viewBox="0 0 220 100" className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]" role="img" aria-label={t('Silhouette de la chaussure')}>
      <path d="M12 72 Q14 44 44 40 L76 30 Q96 18 118 32 L160 44 Q200 50 206 68 L206 76 Q110 82 12 78 Z" fill={colors.upper} stroke="rgba(0,0,0,0.25)" />
      <path d="M8 76 Q110 86 210 78 L210 88 Q110 96 8 88 Z" fill={colors.sole} />
      <g stroke={colors.stripes} strokeWidth="6" strokeLinecap="round">
        <line x1="92" y1="70" x2="108" y2="38" />
        <line x1="108" y1="72" x2="124" y2="40" />
        <line x1="124" y1="73" x2="140" y2="43" />
      </g>
      <circle cx="54" cy="52" r="2.5" fill={colors.stripes} />
      <circle cx="64" cy="47" r="2.5" fill={colors.stripes} />
      <circle cx="74" cy="42" r="2.5" fill={colors.stripes} />
    </svg>
  )
}
