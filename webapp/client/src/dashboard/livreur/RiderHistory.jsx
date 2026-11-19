import { hour, money, orderTotal } from '../lib/format.js'
import { Card, DemoNote, Mono } from '../ui/ui.jsx'
import { brandsOf, useRider } from './rider.js'

/** Livreur · Historique des courses livrées aujourd'hui */
export default function RiderHistory() {
  const { delivered } = useRider()
  const total = delivered.reduce((acc, o) => acc + orderTotal(o), 0)

  return (
    <>
      <header className="bg-d-ink px-5 pb-5 pt-[calc(22px+env(safe-area-inset-top))] text-[#f2efe8]">
        <p className="text-xs text-[#b9b3a7]">Aujourd’hui</p>
        <h1 className="mt-1 text-[26px] font-light">
          Mon <span className="font-serif italic">historique</span>
        </h1>
      </header>
      <div className="flex flex-col gap-3 px-4 pb-3 pt-[18px]">
        {delivered.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-d-muted">Aucune course livrée aujourd’hui.</Card>
        ) : (
          <Card as="ul" className="px-4 py-1.5">
            {delivered.map((o) => (
              <li key={o.number} className="flex items-center justify-between gap-3 border-b border-d-soft py-3 last:border-0">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm">
                    <Mono>{o.number}</Mono>
                    <span className="text-d-muted">· {hour(o.deliveredAt)}</span>
                  </span>
                  <span className="block truncate text-[13px] text-d-muted">
                    {o.customer.name} · {brandsOf(o)}
                  </span>
                </span>
                <Mono className="shrink-0 text-sm">{money(orderTotal(o))}</Mono>
              </li>
            ))}
          </Card>
        )}
        <Card className="flex items-center justify-between px-4 py-3 text-sm">
          <span>
            {delivered.length} course{delivered.length > 1 ? 's' : ''} livrée{delivered.length > 1 ? 's' : ''}
          </span>
          <span className="text-d-muted">
            Commandes : <Mono className="text-d-ink">{money(total)}</Mono>
          </span>
        </Card>
        <p className="mx-1 text-[13px] text-[#1f4a2c]">Toutes payées en ligne, rien à remettre.</p>
        <DemoNote className="mx-1" />
      </div>
    </>
  )
}
