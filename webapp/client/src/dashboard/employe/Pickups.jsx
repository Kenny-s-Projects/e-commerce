import { BRANDS } from '../data/demo.js'
import { useStore } from '../store/store.jsx'
import { hour, money, partTotal, since } from '../lib/format.js'
import { Button, Card, DemoNote, Mono, PageTitle, PartPill } from '../ui/ui.jsx'

/*
 * Retraits en boutique : commandes que le client vient chercher.
 * Prêtes → « Remise au client » ; puis la liste des retraits du jour.
 */
export default function Pickups({ brand }) {
  const { orders, now, dispatch } = useStore()
  const b = BRANDS[brand]
  const mine = orders.filter((o) => o.mode === 'retrait' && !o.cancelled && o.parts.some((p) => p.brand === brand))
  const waiting = mine.filter((o) => !o.deliveredAt)
  const done = mine.filter((o) => o.deliveredAt).sort((x, y) => new Date(y.deliveredAt) - new Date(x.deliveredAt))

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={`${b.name} · Gombe`} before="Re" accent="traits" />
        <p className="max-w-[420px] text-sm text-d-muted">Commandes à remettre en main propre. Vérifiez le numéro de commande avec le client.</p>
      </header>

      <section aria-labelledby="h-wait" className="flex flex-col gap-3">
        <h2 id="h-wait" className="flex items-center gap-2.5 text-[15px] font-medium">
          À remettre
          <span className="rounded-full bg-[#fbefd5] px-2 py-0.5 font-mono text-xs text-[#7a5200]">{waiting.length}</span>
        </h2>
        {waiting.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {waiting.map((o) => {
              const part = o.parts.find((p) => p.brand === brand)
              const ready = part.status === 'prete'
              return (
                <Card key={o.number} className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Mono className="text-[15px]">{o.number}</Mono>
                    <PartPill status={part.status} />
                  </div>
                  <div>
                    <p className="text-[15px]">{o.customer.name}</p>
                    <p className="font-mono text-[13px] text-d-muted">{o.customer.phone}</p>
                  </div>
                  <ul className="flex flex-col gap-1 border-t border-d-soft pt-3 text-sm">
                    {part.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>
                          <strong className="font-semibold">{it.qty} ×</strong> {it.name}
                        </span>
                        <Mono>{money(it.price * it.qty)}</Mono>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-d-muted">
                    {ready ? `Prête depuis ${since(part.readyAt ?? o.createdAt, now)} · ` : 'En préparation · '}
                    payée en ligne, rien à encaisser
                  </p>
                  <Button disabled={!ready} onClick={() => dispatch({ type: 'order/pickedByCustomer', number: o.number })} className="w-full">
                    Remise au client
                  </Button>
                </Card>
              )
            })}
          </div>
        ) : (
          <p className="rounded-[14px] border border-dashed border-d-border px-5 py-8 text-center text-sm text-d-muted">Aucun retrait en attente.</p>
        )}
      </section>

      <section aria-labelledby="h-done" className="mt-10">
        <h2 id="h-done" className="mb-3 text-[15px] font-medium">
          Remis aujourd’hui
        </h2>
        {done.length ? (
          <Card as="ul" className="divide-y divide-d-soft">
            {done.map((o) => {
              const part = o.parts.find((p) => p.brand === brand)
              return (
                <li key={o.number} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-sm">
                  <Mono>{o.number}</Mono>
                  <span className="flex-1">{o.customer.name}</span>
                  <span className="text-d-muted">Remise à {hour(o.deliveredAt)}</span>
                  <Mono>{money(partTotal(part))}</Mono>
                </li>
              )
            })}
          </Card>
        ) : (
          <p className="text-sm text-d-muted">Aucun retrait remis pour l’instant.</p>
        )}
      </section>

      <DemoNote className="mt-8" />
    </>
  )
}
