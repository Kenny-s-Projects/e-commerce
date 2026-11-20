import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'
import useLiteMode from '../../hooks/useLiteMode.js'

const ease = [0.22, 1, 0.36, 1] // --ease-lux

/*
 * Apparition des titres, une seule fois, quand le titre entre à l'écran :
 *  - chaque ligne monte derrière un masque (translateY) avec un léger fondu, décalée de 70 ms ;
 *  - le petit sur-titre et le sous-titre apparaissent en fondu.
 * Seulement transform et opacity : aucun recalcul de mise en page, aucun décalage (CLS).
 * Mode léger ou « Réduire les animations » : le titre est affiché directement.
 */
const line = {
  start: { y: '105%', opacity: 0 },
  show: (i) => ({ y: '0%', opacity: 1, transition: { duration: 0.6, delay: 0.07 * i, ease } }),
}

const fade = {
  start: { opacity: 0, y: 10 },
  show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.07 * i + 0.1, ease } }),
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
  eyebrow: eyebrowFr,
  index,
  total,
  title: titleFr,
  accent: accentFr,
  accentInline = false,
  subtitle: subtitleFr,
  as: Tag = 'h2',
}) {
  // Les textes arrivent en français et sont traduits ici (une seule fois pour toutes les sections)
  const t = useT()
  const lite = useLiteMode()
  const tr = (v) => (typeof v === 'string' ? t(v) : v)
  const eyebrow = tr(eyebrowFr)
  const title = tr(titleFr)
  const accent = tr(accentFr)
  const subtitle = tr(subtitleFr)

  const pad = (n) => String(n).padStart(2, '0')
  const accentEl = <span className="accent inline-block text-[1.08em] leading-none">{accent}</span>
  const small = eyebrow ?? (index != null ? `${pad(index)}${total ? ` / ${pad(total)}` : ''}` : null)

  return (
    <m.div
      className="max-w-[720px]"
      initial={lite ? false : 'start'}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      {small && (
        <m.p className={`caps mb-7 ${eyebrow ? 'text-gold' : 'opacity-80'}`} variants={fade} custom={0}>
          {small}
        </m.p>
      )}

      <Tag className="text-[clamp(36px,4.6vw,64px)] font-light leading-[1.08] tracking-[-0.015em]">
        {accentInline || !title ? (
          <Line i={1} last>
            {title} {accent && accentEl}
          </Line>
        ) : (
          <>
            <Line i={1}>{title}</Line>
            {accent && (
              <Line i={2} last>
                {accentEl}
              </Line>
            )}
          </>
        )}
      </Tag>

      {subtitle && (
        <m.p className="mt-6 max-w-[440px] text-sm leading-[1.75]" variants={fade} custom={3}>
          {subtitle}
        </m.p>
      )}
    </m.div>
  )
}

// Une ligne masquée (overflow caché) dont le texte monte à l'apparition
function Line({ i, last, children }) {
  return (
    <span className={`block overflow-hidden ${last ? 'pb-[0.08em]' : ''}`}>
      <m.span className="block will-change-transform" variants={line} custom={i}>
        {children}
      </m.span>
    </span>
  )
}
