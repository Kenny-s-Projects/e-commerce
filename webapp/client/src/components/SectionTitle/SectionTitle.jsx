import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import useScrollDirection from '../../hooks/useScrollDirection.js'

const ease = [0.22, 1, 0.36, 1]

/*
 * Animation liée au défilement, dans les deux sens :
 *  - on descend : les lignes montent depuis le bas en entrant, et sortent par le haut en quittant l'écran ;
 *  - on remonte : elles redescendent depuis le haut en entrant, et sortent par le bas.
 * En plus, le bloc glisse légèrement (parallaxe) et le mot en italique se décale
 * pendant toute la traversée de l'écran.
 */
const line = {
  // Avant la toute première apparition : en bas, prête à monter
  start: { y: '110%' },
  // Hors écran : la ligne attend du côté par lequel elle va entrer
  hidden: ({ dir }) => ({ y: dir === 'down' ? '-110%' : '110%' }),
  show: ({ i }) => ({ y: '0%', transition: { duration: 0.9, delay: 0.08 * i, ease } }),
}

const fade = {
  start: { opacity: 0, y: 16 },
  hidden: ({ dir }) => ({ opacity: 0, y: dir === 'down' ? -16 : 16 }),
  show: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.3, ease } },
}

/**
 * Titre réutilisable pour toutes les sections.
 *  eyebrow      : petite ligne au-dessus du titre (optionnel), ex. "Toutes maisons"
 *  index        : numéro de la section (optionnel)       → "01 / 04"
 *  total        : nombre total de sections (optionnel)
 *  title        : partie sans-serif du titre (optionnel)
 *  accent       : mot(s) en serif italique
 *  accentInline : true → accent sur la même ligne que le titre (Patchi)
 *                 false → accent à la ligne (Kyra)
 *  subtitle     : texte sous le titre (optionnel)
 *  as           : balise du titre (h2 par défaut)
 */
export default function SectionTitle({
  eyebrow,
  index,
  total,
  title,
  accent,
  accentInline = false,
  subtitle,
  as: Tag = 'h2',
}) {
  const ref = useRef(null)
  const dir = useScrollDirection()

  // 0 quand le haut du bloc entre par le bas de l'écran, 1 quand son bas sort par le haut
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const blockY = useTransform(scrollYProgress, [0, 1], [40, -40])
  const accentX = useTransform(scrollYProgress, [0, 1], ['-0.15em', '0.15em'])

  const pad = (n) => String(n).padStart(2, '0')
  const accentEl = (
    <motion.span className="accent inline-block text-[1.08em] leading-none" style={{ x: accentX }}>
      {accent}
    </motion.span>
  )

  const small = eyebrow ?? (index != null ? `${pad(index)}${total ? ` / ${pad(total)}` : ''}` : null)

  return (
    <motion.div
      ref={ref}
      className="max-w-[720px]"
      style={{ y: blockY }}
      initial="start"
      whileInView="show"
      viewport={{ once: false, amount: 0.3 }}
    >
      {small && (
        <div className="overflow-hidden">
          <motion.p
            className={`caps mb-7 ${eyebrow ? 'text-gold' : 'opacity-80'}`}
            variants={line}
            custom={{ i: 0, dir }}
          >
            {small}
          </motion.p>
        </div>
      )}


      <Tag className="text-[clamp(36px,4.6vw,64px)] font-light leading-[1.08] tracking-[-0.015em]">
        {accentInline || !title ? (
          <span className="block overflow-hidden pb-[0.08em]">
            <motion.span className="block" variants={line} custom={{ i: 1, dir }}>
              {title} {accent && accentEl}
            </motion.span>
          </span>
        ) : (
          <>
            <span className="block overflow-hidden">
              <motion.span className="block" variants={line} custom={{ i: 1, dir }}>
                {title}
              </motion.span>
            </span>
            {accent && (
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span className="block" variants={line} custom={{ i: 2, dir }}>
                  {accentEl}
                </motion.span>
              </span>
            )}
          </>
        )}
      </Tag>

      {subtitle && (
        <motion.p className="mt-6 max-w-[440px] text-sm leading-[1.75]" variants={fade} custom={{ dir }}>
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
