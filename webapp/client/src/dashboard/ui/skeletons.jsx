// Squelettes du dashboard : premier chargement seulement (pas à chaque actualisation de 15 s).
// Mêmes cadres que les écrans réels (cartes blanches, bord d-line), formes en d-soft.
import { Block, Kpi, Lines, RideCard, SkeletonGroup, Table } from '../../components/Skeleton/Skeleton.jsx'
import { Button, Card } from './ui.jsx'
import { tr } from '../lib/i18n.js'

const TONE = '[--sk:var(--color-d-soft)]'

/** Échec du premier chargement : message clair + « Réessayer » (jamais de squelette sans fin) */
export function LoadError({ error, onRetry, className = '' }) {
  return (
    <Card className={`flex flex-col items-center gap-3 px-6 py-12 text-center ${className}`} role="alert">
      <p className="text-[17px]">{tr('Les données ne répondent pas pour le moment.')}</p>
      {error?.message && <p className="max-w-md text-sm text-d-muted">{tr(error.message)}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          {tr('Réessayer')}
        </Button>
      )}
    </Card>
  )
}

/** Vue d'ensemble : 4 chiffres clés, statuts + alertes, tableau + cartes latérales */
export function OverviewSkeleton() {
  return (
    <SkeletonGroup label={tr('Chargement de la vue d’ensemble…')} className={TONE}>
      <div className="mb-[18px] grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Kpi key={i} />)}
      </div>
      <div className="mb-[18px] grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.95fr)]">
        <Card className="p-5">
          <Block className="h-4 w-48 rounded-full" />
          <Block className="mt-5 h-3 w-full rounded-full" />
          <div className="mt-5 flex flex-wrap gap-4">
            {Array.from({ length: 5 }, (_, i) => <Block key={i} className="h-3 w-20 rounded-full" />)}
          </div>
        </Card>
        <Card className="p-5">
          <Block className="h-4 w-24 rounded-full" />
          <Lines count={3} className="mt-5" />
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.95fr)]">
        <Card className="min-w-0 overflow-hidden">
          <div className="px-5 pb-1 pt-[18px]">
            <Block className="h-4 w-40 rounded-full" />
          </div>
          <Table rows={6} cols={5} />
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:flex lg:flex-col">
          <Card className="p-5">
            <Block className="h-4 w-36 rounded-full" />
            <Lines count={2} className="mt-5" lineClass="h-2.5" />
          </Card>
          <Card className="p-5">
            <Block className="h-4 w-24 rounded-full" />
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="mt-4 flex items-center gap-3">
                <Block className="size-10 shrink-0 rounded-full" />
                <Lines count={2} className="flex-1" lineClass="h-2.5" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </SkeletonGroup>
  )
}

/** Liste des commandes : tableau (ordinateur) ou cartes (téléphone) */
export function OrdersSkeleton({ rows = 8 }) {
  return (
    <SkeletonGroup label={tr('Chargement des commandes…')} className={TONE}>
      <Card className="overflow-hidden max-sm:hidden">
        <Table rows={rows} cols={6} />
      </Card>
      <div className="grid gap-3 sm:hidden">
        {Array.from({ length: 4 }, (_, i) => <RideCard key={i} />)}
      </div>
    </SkeletonGroup>
  )
}

/** Colonnes de cartes (dispatch, file des commandes) */
export function ColumnsSkeleton({ columns = 3, cards = [2, 2, 1], label, columnClass = '' }) {
  return (
    <SkeletonGroup label={label ?? tr('Chargement…')} className={`grid gap-4 lg:grid-cols-3 ${TONE}`}>
      {Array.from({ length: columns }, (_, c) => (
        <div key={c} className={`flex flex-col gap-3 ${columnClass}`}>
          <Block className="h-4 w-32 rounded-full" />
          {Array.from({ length: cards[c] ?? 1 }, (_, i) => <RideCard key={i} />)}
        </div>
      ))}
    </SkeletonGroup>
  )
}

/** Courses du livreur : cartes de course */
export function RidesSkeleton({ count = 2 }) {
  return (
    <SkeletonGroup label={tr('Chargement de vos courses…')} className={`flex flex-col gap-3 ${TONE}`}>
      {Array.from({ length: count }, (_, i) => <RideCard key={i} />)}
    </SkeletonGroup>
  )
}
