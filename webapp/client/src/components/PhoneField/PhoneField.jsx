import { useT } from '../../i18n/lang.js'
import { COUNTRIES, countryOf, nationalDigits, splitPhone } from './phone.js'

/**
 * Champ téléphone avec indicatif pays (sélecteur natif, +243 RDC par défaut) + numéro national.
 * Le sélecteur natif reste accessible (clavier, lecteur d'écran) ; sa case fermée n'affiche que « 🇨🇩 +243 ».
 *  id            : id du champ numéro (relié au <label> de la page)
 *  code          : indicatif choisi (« 243 ») · onCodeChange(code)
 *  value         : numéro national saisi · onChange(value)
 *  invalid       : true → bordure d'erreur · describedBy : id du message d'erreur
 *  className     : classes du cadre (hauteur, bordure, arrondi, couleur selon l'erreur)
 *  inputClassName: classes du champ numéro (taille du texte)
 * Un numéro collé avec son indicatif (« +33 6 12 34 56 78 ») règle l'indicatif tout seul.
 * Le 0 de tête (« 0812… ») est retiré quand on quitte le champ.
 */
export default function PhoneField({ id, code, onCodeChange, value, onChange, invalid, describedBy, className = '', inputClassName = 'text-[14px]', placeholder, ...rest }) {
  const t = useT()
  const country = countryOf(code)

  const change = (e) => {
    const v = e.target.value
    if (/^\s*(\+|00)\d/.test(v)) {
      const parsed = splitPhone(v, code)
      if (parsed.code !== code) onCodeChange(parsed.code)
      onChange(parsed.number)
      return
    }
    onChange(v)
  }

  return (
    <div className={`flex min-w-0 overflow-hidden border bg-white transition-colors focus-within:border-ink ${className}`}>
      <span className="relative flex shrink-0 items-center gap-1.5 border-r border-current/15 bg-ink/[0.03] pl-3 pr-2 focus-within:bg-ink/[0.06] focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ink/50">
        <span aria-hidden className="text-[15px] leading-none">{country.flag}</span>
        <span aria-hidden className="text-[14px] tabular-nums">+{country.code}</span>
        <svg aria-hidden viewBox="0 0 24 24" className="size-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
        <select
          aria-label={t('Indicatif')}
          value={country.code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} +{c.code} · {t(c.name)}
            </option>
          ))}
        </select>
      </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={value}
        onChange={change}
        onBlur={() => value && /^\D*0/.test(value) && onChange(nationalDigits(value))}
        placeholder={placeholder ?? (code === '243' ? '812 345 678' : '')}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className={`min-w-0 flex-1 bg-transparent px-3.5 outline-none placeholder:text-ink/35 ${inputClassName}`}
        {...rest}
      />
    </div>
  )
}
