import HouseMark from '../HouseMark/HouseMark.jsx'

/**
 * Carte d'une collection : visuel + nom en italique + petite note.
 *  collection : { id, label, note?, img? }
 *  house      : la Maison (couleurs, logo de remplacement)
 *  count      : nombre de produits (affiché si la collection n'a pas de note)
 *  active     : collection actuellement filtrée
 *  onSelect   : clic → filtre la grille
 */
export default function CollectionCard({ collection, house, count, active, onSelect }) {
  const { shop } = house
  const fit =
    shop.fit === 'contain' ? 'size-[74%] object-contain mix-blend-multiply' : 'size-full object-cover'

  return (
    <button type="button" onClick={() => onSelect(collection.id)} className="group block w-full text-left">
      <div
        className={`relative grid aspect-[3/4] place-items-center overflow-hidden transition-[box-shadow] duration-500 ${shop.radius} ${shop.colors.card} ${
          active ? 'ring-1 ring-current ring-offset-4 ring-offset-transparent' : ''
        }`}
      >
        {collection.img ? (
          <img
            src={collection.img}
            alt=""
            loading="lazy"
            className={`absolute inset-0 m-auto transition-[scale] duration-[1100ms] ease-lux group-hover:scale-106 ${fit}`}
          />
        ) : (
          <div className="transition-[scale] duration-[1100ms] ease-lux group-hover:scale-110">
            <HouseMark house={house} onLight className="h-9 opacity-80" textClass="text-2xl" />
          </div>
        )}
      </div>

      <p className="accent mt-3.5 text-xl leading-tight">{collection.label}</p>
      <p className="mt-1 text-[11px] opacity-70">
        {collection.note ?? `${count} produit${count > 1 ? 's' : ''}`}
      </p>
    </button>
  )
}
