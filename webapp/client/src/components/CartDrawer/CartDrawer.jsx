import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice, productImages } from '../../data/houses.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Panier en tiroir : glisse depuis la droite, pas de page panier.
 *  open    : affiché ou non
 *  items   : [{ product, qty }]
 *  onQty   : (id, qty) → change la quantité (0 retire la ligne)
 *  onClose : fermeture (bouton, fond, touche Échap)
 *  onCheckout : « Commander » → page de commande (#checkout) avec tous les articles du panier
 */
export default function CartDrawer({ open, items, onQty, onClose, onCheckout }) {
  const t = useT()
  const count = items.reduce((n, l) => n + l.qty, 0)
  const subtotal = items.reduce((s, l) => s + (l.product.price ?? 0) * l.qty, 0)

  // Échap ferme le tiroir ; la page ne défile plus derrière
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('Panier')}>
          <motion.button
            type="button"
            aria-label={t('Fermer le panier')}
            className="absolute inset-0 cursor-default bg-black/45"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease }}
          />

          <motion.aside
            className="absolute inset-y-0 right-0 flex w-[min(460px,100vw)] flex-col bg-white px-8 pt-7 pb-8 text-ink shadow-[-30px_0_60px_rgba(0,0,0,0.15)] max-sm:px-5"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.7, ease }}
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="caps">{t('Panier')} ({count})</p>
              <button type="button" onClick={onClose} className="caps py-2">{t('Fermer')}</button>
            </div>

            {items.length === 0 ? (
              <p className="mt-10 text-sm text-ink/60">{t('Votre panier est vide.')}</p>
            ) : (
              <ul className="-mr-2 flex-1 overflow-y-auto pr-2">
                <AnimatePresence initial={false}>
                  {items.map(({ product, qty }) => (
                    <motion.li
                      key={product.id}
                      layout
                      className="flex gap-4 border-b border-ink/10 py-5"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.5, ease }}
                    >
                      <div className="relative size-[84px] shrink-0 overflow-hidden bg-[#f3f2ef]">
                        {productImages(product)[0] && (
                          <img
                            src={productImages(product)[0]}
                            alt=""
                            className={`absolute inset-0 m-auto ${product.boxed ? 'size-full object-cover' : 'size-[80%] object-contain mix-blend-multiply'}`}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="caps text-[9px] opacity-60">{product.house?.name ?? product.store}</p>
                        <p className="mt-1 text-sm leading-snug">{t(product.name)}</p>
                        <p className="mt-1 text-xs text-ink/60">{formatPrice(product.price, product.unit)}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex items-center border border-ink/20">
                            <button type="button" aria-label={t('Moins')} className="grid size-8 place-items-center" onClick={() => onQty(product.id, qty - 1)}>−</button>
                            <span className="w-6 text-center text-xs">{qty}</span>
                            <button type="button" aria-label={t('Plus')} className="grid size-8 place-items-center" onClick={() => onQty(product.id, qty + 1)}>+</button>
                          </div>
                          <button type="button" className="text-xs underline underline-offset-4 opacity-60 hover:opacity-100" onClick={() => onQty(product.id, 0)}>
                            {t('Retirer')}
                          </button>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm">${(product.price ?? 0) * qty}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            <div className="mt-auto border-t border-ink pt-5">
              <div className="flex justify-between text-[15px]">
                <span>{t('Sous-total')}</span>
                <span>${subtotal}</span>
              </div>
              <p className="mt-2 mb-5 text-xs leading-relaxed text-ink/60">
                {t('Livraison à Gombe le jour même (4 $) ou retrait gratuit en boutique, dès 9h00.')}
              </p>
              <button
                type="button"
                onClick={onCheckout}
                disabled={items.length === 0}
                className="caps grid h-14 w-full place-items-center bg-ink text-white transition-opacity duration-400 hover:opacity-85 disabled:pointer-events-none disabled:opacity-30"
              >
                {t('Commander')}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
