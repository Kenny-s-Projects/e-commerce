import { useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

/**
 * Liste de questions / rubriques dépliables, une ouverte à la fois.
 *  items      : [{ title, content }] (content : texte ou élément)
 *  defaultOpen: index ouvert au départ (-1 = aucun)
 *  size       : 'md' (fiche produit) | 'lg' (page Aide)
 */
export default function Accordion({ items, defaultOpen = 0, size = 'md' }) {
  const [open, setOpen] = useState(defaultOpen)
  const title = size === 'lg' ? 'text-[16px] py-5' : 'text-[14px] py-[18px]'

  return (
    <div className="border-t border-current/15">
      {items.map((it, i) => {
        const on = i === open
        return (
          <div key={it.title} className="border-b border-current/15">
            <button
              type="button"
              aria-expanded={on}
              onClick={() => setOpen(on ? -1 : i)}
              className={`flex w-full items-center justify-between gap-5 text-left ${title}`}
            >
              {it.title}
              <m.span aria-hidden className="text-lg leading-none" animate={{ rotate: on ? 45 : 0 }} transition={{ duration: 0.4, ease }}>
                +
              </m.span>
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease }}
                  className="overflow-hidden"
                >
                  <div className="max-w-[620px] pb-5 text-[13px] leading-[1.75] opacity-80">{it.content}</div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
