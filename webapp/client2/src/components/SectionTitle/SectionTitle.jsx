import { motion } from 'framer-motion'
import './SectionTitle.css'

const ease = [0.22, 1, 0.36, 1]

// Chaque ligne monte depuis un masque quand la section entre à l'écran
const line = {
  hidden: { y: '110%' },
  show: (i) => ({ y: '0%', transition: { duration: 0.9, delay: 0.1 * i, ease } }),
}

/**
 * Titre réutilisable pour toutes les sections.
 *  index    : numéro de la section (optionnel)       → "01 / 04"
 *  total    : nombre total de sections (optionnel)
 *  title    : partie sans-serif du titre
 *  accent   : mot(s) en serif italique, sur la ligne suivante
 *  subtitle : texte sous le titre (optionnel)
 *  as       : balise du titre (h2 par défaut)
 */
export default function SectionTitle({ index, total, title, accent, subtitle, as: Tag = 'h2' }) {
  const pad = (n) => String(n).padStart(2, '0')

  return (
    <motion.div
      className="section-title"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      {index != null && (
        <div className="section-title__mask">
          <motion.p className="section-title__index caps" variants={line} custom={0}>
            {pad(index)}{total ? ` / ${pad(total)}` : ''}
          </motion.p>
        </div>
      )}

      <Tag className="section-title__heading">
        <span className="section-title__mask">
          <motion.span className="section-title__line" variants={line} custom={1}>
            {title}
          </motion.span>
        </span>
        {accent && (
          <span className="section-title__mask">
            <motion.span className="section-title__line accent" variants={line} custom={2}>
              {accent}
            </motion.span>
          </span>
        )}
      </Tag>

      {subtitle && (
        <motion.p
          className="section-title__subtitle"
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