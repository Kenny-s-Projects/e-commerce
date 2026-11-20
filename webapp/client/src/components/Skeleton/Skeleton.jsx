/**
 * Squelettes de chargement : la mise en page apparaît tout de suite, le contenu la remplace ensuite.
 * Reflet animé en CSS uniquement (.sk dans index.css), statique en mouvement réduit et en mode léger.
 *
 *  <SkeletonGroup label="Chargement des produits">
 *    <Skeleton.ProductCard />
 *  </SkeletonGroup>
 *
 * Couleurs : la forme reprend la couleur du texte (currentColor à 9 %) ; on peut la fixer avec
 * la variable --sk (ex. className="[--sk:var(--color-d-soft)]" dans le dashboard).
 */

/** Conteneur accessible : annonce le chargement aux lecteurs d'écran, les formes restent muettes */
export function SkeletonGroup({ label = 'Chargement…', className = '', children, as: Tag = 'div' }) {
  return (
    <Tag className={className} aria-busy="true" role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </Tag>
  )
}

/** Bloc générique (largeur / hauteur / arrondi par classes) */
export function Block({ className = '' }) {
  return <div className={`sk rounded ${className}`} />
}

/** Une ou plusieurs lignes de texte ; la dernière est plus courte */
export function Lines({ count = 2, className = '', lineClass = 'h-3' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`sk rounded-full ${lineClass} ${i === count - 1 && count > 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

/** Carte produit du site : photo 4/5, Maison, nom, prix, bouton */
export function ProductCard({ frame = 'aspect-[4/5]' }) {
  return (
    <div>
      <div className={`sk mb-5 ${frame}`} />
      <div className="sk mb-2 h-2 w-16 rounded-full" />
      <div className="flex items-center justify-between gap-4">
        <div className="sk h-3.5 w-1/2 rounded-full" />
        <div className="sk h-3.5 w-12 rounded-full" />
      </div>
      <div className="sk mt-4 h-10 w-full" />
    </div>
  )
}

/** Grille de cartes produit (mêmes colonnes que la grille réelle) */
export function ProductGrid({ count = 6, className = 'grid-cols-3 max-[900px]:grid-cols-2' }) {
  return (
    <div className={`grid gap-x-[clamp(16px,2.2vw,32px)] gap-y-[clamp(40px,4.5vw,64px)] ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCard key={i} />
      ))}
    </div>
  )
}

/** Ligne de liste : vignette + deux lignes + valeur à droite (recherche, commandes) */
export function ListRow({ thumb = true, className = '' }) {
  return (
    <div className={`flex items-center gap-4 py-3 ${className}`}>
      {thumb && <div className="sk size-12 shrink-0 rounded" />}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="sk h-2 w-24 rounded-full" />
        <div className="sk h-3.5 w-3/5 rounded-full" />
      </div>
      <div className="sk h-3.5 w-12 shrink-0 rounded-full" />
    </div>
  )
}

/** Carte de course (livreur) ou carte de commande (dashboard) */
export function RideCard({ className = '' }) {
  return (
    <div className={`rounded-[14px] border border-d-line bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="sk h-4 w-20 rounded-full" />
        <div className="sk h-6 w-24 rounded-full" />
      </div>
      <div className="sk mt-4 h-3.5 w-1/2 rounded-full" />
      <div className="sk mt-2 h-3 w-3/4 rounded-full" />
      <div className="mt-4 flex gap-2">
        <div className="sk h-6 w-20 rounded-full" />
        <div className="sk h-6 w-24 rounded-full" />
      </div>
    </div>
  )
}

/** Tableau : rangées de cellules (dashboard) */
export function Table({ rows = 6, cols = 6, className = '' }) {
  return (
    <div className={`divide-y divide-d-line ${className}`}>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid items-center gap-4 px-5 py-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className={`sk h-3.5 rounded-full ${c === 0 ? 'w-4/5' : c % 2 ? 'w-3/5' : 'w-2/3'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** En-tête de profil : avatar rond + nom + onglets */
export function Profile({ className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-5">
        <div className="sk size-[56px] shrink-0 rounded-full md:size-[72px]" />
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="sk h-2.5 w-24 rounded-full" />
          <div className="sk h-7 w-56 max-w-full rounded-full" />
        </div>
      </div>
      <div className="mt-7 flex gap-6">
        {[72, 64, 56, 72].map((w, i) => (
          <div key={i} className="sk h-3.5 rounded-full" style={{ width: w }} />
        ))}
      </div>
    </div>
  )
}

/** Carte chiffre clé (dashboard) */
export function Kpi({ className = '' }) {
  return (
    <div className={`rounded-[14px] border border-d-line bg-white p-5 ${className}`}>
      <div className="sk h-3 w-28 rounded-full" />
      <div className="sk mt-5 h-8 w-20 rounded" />
      <div className="sk mt-4 h-2.5 w-32 rounded-full" />
    </div>
  )
}

const Skeleton = { Group: SkeletonGroup, Block, Lines, ProductCard, ProductGrid, ListRow, RideCard, Table, Profile, Kpi }
export default Skeleton
