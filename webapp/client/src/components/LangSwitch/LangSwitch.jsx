import { LANGS, useLang } from '../../i18n/lang.js'

/**
 * Bouton de langue FR | EN. La langue choisie est gardée d'une visite à l'autre.
 *  className : couleurs / taille
 *  compact   : une seule pastille qui bascule (header réduit)
 */
export default function LangSwitch({ className = '', compact = false }) {
  const { lang, setLang } = useLang()

  if (compact) {
    const next = lang === 'fr' ? 'en' : 'fr'
    return (
      <button
        type="button"
        onClick={() => setLang(next)}
        aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
        className={`caps ${className}`}
      >
        {lang.toUpperCase()}
      </button>
    )
  }

  return (
    <div role="group" aria-label="Langue / Language" className={`flex items-center gap-1 ${className}`}>
      {LANGS.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden className="opacity-40">|</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            lang={l}
            className={`relative px-0.5 uppercase transition-opacity ${lang === l ? 'opacity-100' : 'opacity-50 hover:opacity-90'}`}
          >
            {l}
            {lang === l && <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-px bg-current" />}
          </button>
        </span>
      ))}
    </div>
  )
}
