import { motion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

// Chaque ligne monte depuis un masque quand la section entre à l'écran
const line = {
  hidden: { y: '110%' },
  show: (i) => ({ y: '0%', transition: { duration: 0.9, delay: 0.1 * i, ease } }),
}

/**
 * Titre réutilisable pour toutes les sections.
 *  index        : numéro de la section (optionnel)       → "01 / 04"
 *  total        : nombre total de sections (optionnel)
 *  title        : partie sans-serif du titre
 *  accent       : mot(s) en serif italique
 *  accentInline : true → accent sur la même ligne que le titre (Patchi)
 *                 false → accent à la ligne (Kyra)
 *  subtitle     : texte sous le titre (optionnel)
 *  as           : balise du titre (h2 par défaut)
 */
export default function SectionTitle({
  index,
  total,
  title,
  accent,
  accentInline = false,
  subtitle,
  as: Tag = 'h2',
}) {
  const pad = (n) => String(n).padStart(2, '0')
  const accentClass = 'accent text-[1.08em] leading-none'

  return (
    <motion.div
      className="max-w-[720px]"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      {index != null && (
        <div className="overflow-hidden">
          <motion.p className="caps mb-7 opacity-80" variants={line} custom={0}>
            {pad(index)}{total ? ` / ${pad(total)}` : ''}
          </motion.p>
        </div>
      )}

      <Tag className="text-[clamp(36px,4.6vw,64px)] font-light leading-[1.08] tracking-[-0.015em]">
        {accentInline ? (
          <span className="block overflow-hidden pb-[0.08em]">
            <motion.span className="block" variants={line} custom={1}>
              {title} {accent && <span className={accentClass}>{accent}</span>}
            </motion.span>
          </span>
        ) : (
          <>
            <span className="block overflow-hidden">
              <motion.span className="block" variants={line} custom={1}>
                {title}
              </motion.span>
            </span>
            {accent && (
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span className={`block ${accentClass}`} variants={line} custom={2}>
                  {accent}
                </motion.span>
              </span>
            )}
          </>
        )}
      </Tag>

      {subtitle && (
        <motion.p
          className="mt-6 max-w-[440px] text-sm leading-[1.75]"
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.35, ease } },
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
