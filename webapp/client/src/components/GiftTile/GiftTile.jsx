import { useT } from '../../i18n/lang.js'
import useImageState from '../../hooks/useImageState.js'

/**
 * Tuile « idée cadeau » : image + libellé en italique + « Voir ».
 *  item : { id, label, img, fit, tone } (voir data/home.js)
 */
const FIT = {
  contain: 'size-[72%] object-contain mix-blend-multiply',
  boxed: 'aspect-square w-[70%] object-cover',
  bleed: 'size-full object-cover',
}

export default function GiftTile({ item }) {
  const t = useT()
  const { attach, onLoad, onError, ready, failed, cached } = useImageState()
  return (
    <a href={`#offrir/${item.id}`} className="group block">
      <div className={`relative grid aspect-[5/6] place-items-center overflow-hidden ${item.tone}`}>
        {/* Fond de la tuile tout de suite, photo en fondu une fois chargée (sans fondu si déjà en cache) */}
        {!failed && (
          <img
            ref={attach}
            loading="lazy"
            decoding="async"
            src={item.img}
            alt=""
            onLoad={onLoad}
            onError={onError}
            className={`absolute inset-0 m-auto group-hover:scale-106 ${FIT[item.fit]} ${
              cached ? 'transition-[scale] duration-[1100ms] ease-lux' : 'img-reveal [transition:opacity_0.4s_var(--ease-lux),scale_1.1s_var(--ease-lux)]'
            } ${ready ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="accent text-2xl">{t(item.label)}</span>
        <span className="caps relative text-[9px] after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-lux group-hover:after:origin-left group-hover:after:scale-x-100">
          {t('Voir')}
        </span>
      </div>
    </a>
  )
}
