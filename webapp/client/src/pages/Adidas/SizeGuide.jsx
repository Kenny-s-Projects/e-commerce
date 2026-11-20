import { m } from 'framer-motion'
import Reveal, { FadeUp } from '../../components/maison/Reveal.jsx'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Guide des tailles : les lignes du tableau arrivent l'une après l'autre.
 * Les correspondances UK et cm sont à reprendre du guide officiel adidas.
 */
export default function SizeGuide({ sizes }) {
  const t = useT()
  const rows = [
    { label: 'EU', values: sizes },
    { label: 'UK', values: sizes.map(() => '[ ]') },
    { label: t('Pied (cm)'), values: sizes.map(() => '[ ]') },
  ]
  return (
    <section id="taille" className="flex scroll-mt-16 flex-wrap items-center gap-12 bg-[#f3f3f1] px-gutter py-[clamp(64px,8vw,104px)] text-black">
      <div className="flex-[1_1_320px]">
        <Reveal as="p" className="caps text-black/60">{t('Bien choisir')}</Reveal>
        <Reveal as="h2" delay={0.1} className="mt-4 text-[clamp(32px,3.6vw,48px)] font-medium uppercase tracking-[-0.02em]">
          {t('La bonne')} <span className="accent normal-case">{t('pointure.')}</span>
        </Reveal>
        <FadeUp as="p" delay={0.2} className="mt-4 text-[14px] leading-[1.7] text-black/75">
          {t('Un doute ? Écrivez au concierge sur WhatsApp avant de commander.')}
        </FadeUp>
      </div>
      <div className="flex-[2_1_520px] overflow-x-auto">
        <table className="w-full border-collapse text-center text-[13px]">
          <tbody>
            {rows.map((r, i) => (
              <m.tr
                key={r.label}
                className={i === 0 ? 'border-b border-black' : 'border-b border-black/15'}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.7, delay: i * 0.12, ease }}
              >
                <th scope="row" className="px-2 py-3.5 text-left font-medium">{r.label}</th>
                {r.values.map((v, j) => (
                  <td key={j} className="py-3.5">{v}</td>
                ))}
              </m.tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2.5 text-[11px] text-black/60">{t('Correspondances à reprendre du guide officiel adidas.')}</p>
      </div>
    </section>
  )
}
