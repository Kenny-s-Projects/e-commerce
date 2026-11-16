import { motion } from 'framer-motion'
import './TitleCta.css'

/**
 * CTA à droite du titre de section : nom (ou logo) de la Maison + lien.
 *  name  : nom affiché en grand ("kyra")
 *  logo  : image du logo, remplace le nom si fournie
 *  label : texte du lien ("Entrer chez kyra")
 *  href  : destination
 */
export default function TitleCta({ name, logo, label, href = '#' }) {
  return (
    <motion.div
      className="title-cta"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {logo ? (
        <img className="title-cta__logo" src={logo} alt={name} />
      ) : (
        <span className="title-cta__name">{name}</span>
      )}

      <a href={href} className="title-cta__link caps">
        <span>{label}</span>
        <span className="title-cta__arrow" aria-hidden>⟶</span>
      </a>
    </motion.div>
  )
}