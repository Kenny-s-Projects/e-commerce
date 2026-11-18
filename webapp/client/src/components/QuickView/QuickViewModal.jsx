import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gallery, QtyStepper, WeightPicker } from '../Purchase/Purchase.jsx'
import { PRODUCT_THEMES } from '../Purchase/theme.js'
import usePurchase from "../../hooks/usePurchase.js"
import { productGallery } from '../../data/products.js'
import { formatPrice } from '../../data/houses.js'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * Aperçu rapide : popup ouverte depuis une carte produit (bouton « Aperçu »).
 * Photos, poids, quantité, ajout au panier sans quitter la page, lien vers la fiche complète.
 * Fermeture : croix, Échap, clic à côté, ou clic sur « Voir la fiche complète ».
 *  product : produit à afficher (null = fermé) · onClose · onAdd
 */
export default function QuickViewModal({ product, onClose, onAdd }) {
  const t = useT()
  useEffect(() => {
    if (!product) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [product, onClose])

  return (
    <AnimatePresence>
      {product && (
        <div key={product.id} className="fixed inset-0 z-[65] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={`${t('Aperçu')} : ${t(product.name)}`}>
          <motion.button
            type="button"
            aria-label={t('Fermer l’aperçu')}
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative grid max-h-[calc(100svh-32px)] w-[min(980px,100%)] grid-cols-2 overflow-auto rounded-2xl bg-white text-ink shadow-[0_40px_100px_rgba(0,0,0,0.3)] max-md:grid-cols-1"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.25 } }}
            transition={{ duration: 0.55, ease }}
          >
            <QuickViewBody product={product} onClose={onClose} onAdd={onAdd} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function QuickViewBody({ product, onClose, onAdd }) {
  const t = useT()
  const theme = PRODUCT_THEMES[product.maison]
  const buy = usePurchase(product, onAdd)

  return (
    <>
      <div className="p-4 max-md:pb-0">
        <Gallery product={product} photos={productGallery(product)} tone={theme.tone} layout="below" rounded="rounded-xl" />
      </div>
      <div className="relative flex flex-col gap-5 px-9 py-10 max-md:px-5 max-md:py-6">
        <button type="button" onClick={onClose} aria-label={t('Fermer')} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-ink/15 hover:border-ink">✕</button>
        <p className={`caps pr-12 ${theme.eyebrow}`}>{product.house.name}{product.store ? ` · ${t(product.store)}` : ''}</p>
        <h2 className="-mt-2 text-[clamp(26px,2.6vw,34px)] font-light leading-[1.1]">{t(product.name)}</h2>
        <p className="text-[28px] font-light">
          {buy.available ? formatPrice(buy.unitPrice) : '[Prix]'}
          {buy.byWeight && <span className="ml-2 text-[12px] text-ink/60">· {t('96 $ le kg')}</span>}
        </p>
        {buy.byWeight && <WeightPicker weights={buy.weights} value={buy.weight} onChange={buy.setWeight} pricePerKg={product.price} solid={theme.solid} compact />}
        <div className="flex gap-2.5">
          {buy.available && <QtyStepper value={buy.qty} onChange={buy.setQty} />}
          <button type="button" onClick={buy.add} disabled={!buy.available} className={`h-[54px] flex-1 rounded-full text-[14px] disabled:opacity-50 ${theme.solid}`}>
            {!buy.available ? t('Prix à venir') : buy.added ? t('Ajouté au panier ✓') : `${t('Ajouter')} · ${formatPrice(buy.total)}`}
          </button>
        </div>
        {product.stock != null && <p className="text-[12px] text-ink/70">{t('{n} en stock · Livraison à Gombe le jour même', { n: `${product.stock}${product.unit === 'kg' ? ' kg' : ''}` })}</p>}
        <a href={`#produit/${product.id}`} onClick={onClose} className="caps mt-auto self-start border-b border-current pb-1">
          {t('Voir la fiche complète')} ⟶
        </a>
      </div>
    </>
  )
}
