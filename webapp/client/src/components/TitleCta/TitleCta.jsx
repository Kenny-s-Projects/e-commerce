import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'

/**
 * CTA à droite du titre de section : nom (ou logo) de la Maison + lien.
 *  name  : nom affiché en grand ("kyra")
 *  logo  : image du logo, remplace le nom si fournie
 *  label : texte du lien ("Entrer chez kyra")
 *  href  : destination
 */
export default function TitleCta({ name, logo, label, href = '#' }) {
  const t = useT()
  return (
    <m.div
      className="flex flex-col items-end gap-3.5 max-sm:items-start"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {logo ? (
        <img loading="lazy" decoding="async" src={logo} alt={name} className="h-[clamp(40px,4.4vw,64px)] w-auto" />
      ) : (
        <span className="text-[clamp(44px,5vw,72px)] font-light leading-[0.8] tracking-[-0.02em]">
          {name}
        </span>
      )}

      {/* Trait sous le lien qui se redessine au survol, flèche qui avance */}
      <a
        href={href}
        className="caps group relative inline-flex items-center gap-[18px] pb-2 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-current hover:after:animate-redraw"
      >
        <span>{typeof label === 'string' ? t(label) : label}</span>
        <span aria-hidden className="text-sm transition-transform duration-500 ease-lux group-hover:translate-x-1.5">
          ⟶
        </span>
      </a>
    </m.div>
  )
}
