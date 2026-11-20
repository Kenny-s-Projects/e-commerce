import { m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

const link =
  'relative text-[13px] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-400 after:ease-lux hover:after:origin-left hover:after:scale-x-100'

/**
 * Pied de page noir : signature, colonnes de liens, contact, copyright et langue.
 *  footer  : { signature, columns, copyright } (voir data/home.js)
 *  contact : { address, phone, phoneHref, email }
 *  lang, onLang : langue courante et changement FR | EN
 */
export default function Footer({ footer, contact, lang = 'fr', onLang }) {
  const t = useT()
  return (
    <footer className="bg-black px-gutter pt-[clamp(56px,7vw,96px)] pb-8 text-white">
      <m.div
        className="grid grid-cols-4 gap-10 max-[900px]:grid-cols-2 max-sm:grid-cols-1"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease }}
      >
        {/* Signature */}
        <div>
          <p className="text-2xl font-medium">kclick</p>
          <p className="mt-4 text-xs leading-[1.8] text-white/60">
            {footer.signature.map((line) => (
              <span key={line} className="block">{t(line)}</span>
            ))}
          </p>
        </div>

        {/* Colonnes de liens */}
        {footer.columns.map((col) => (
          <nav key={col.title}>
            <p className="caps mb-5 text-[9px] text-gold">{t(col.title)}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={link}>{t(l.label)}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Contact */}
        <div>
          <p className="caps mb-5 text-[9px] text-gold">{t('Contact')}</p>
          <ul className="space-y-2.5 text-[13px] text-white/80">
            <li>{contact.address}</li>
            <li><a href={contact.phoneHref} className={link}>{contact.phone}</a></li>
            <li><a href={`mailto:${contact.email}`} className={`${link} break-all`}>{contact.email}</a></li>
          </ul>
        </div>
      </m.div>

      <div className="mt-[clamp(48px,6vw,80px)] flex items-center justify-between border-t border-white/10 pt-6 text-[11px] text-white/50">
        <span>{footer.copyright}</span>
        <span className="flex gap-1.5">
          {['fr', 'en'].map((l, i) => (
            <span key={l} className="flex gap-1.5">
              {i > 0 && <span>|</span>}
              <button
                type="button"
                onClick={() => onLang?.(l)}
                className={`uppercase transition-colors ${lang === l ? 'text-white' : 'hover:text-white'}`}
              >
                {l}
              </button>
            </span>
          ))}
        </span>
      </div>
    </footer>
  )
}
