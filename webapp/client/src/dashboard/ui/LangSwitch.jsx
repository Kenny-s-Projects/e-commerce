import { useDashLang } from '../lib/i18n.js'

/**
 * Bouton FR | EN du dashboard (préférence gardée, partagée avec le site).
 *  tone : 'dark' (barres noires) ou 'light' (fond clair)
 */
export default function LangSwitch({ tone = 'dark', className = '' }) {
  const { lang, setLang } = useDashLang()
  const muted = tone === 'dark' ? 'text-white/55 hover:text-white' : 'text-d-muted hover:text-d-ink'
  const active = tone === 'dark' ? 'text-white' : 'text-d-ink'
  return (
    <div role="group" aria-label="Langue / Language" className={`flex items-center gap-1 font-mono text-[12px] ${className}`}>
      {['fr', 'en'].map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden className={tone === 'dark' ? 'text-white/30' : 'text-d-border'}>|</span>}
          <button
            type="button"
            lang={l}
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`relative grid h-8 min-w-8 place-items-center px-1 uppercase transition-colors ${lang === l ? active : muted}`}
          >
            {l}
            {lang === l && <span aria-hidden className="absolute inset-x-1.5 bottom-1 h-px bg-current" />}
          </button>
        </span>
      ))}
    </div>
  )
}
