import { m } from 'framer-motion'
import Accordion from '../../components/Accordion/Accordion.jsx'
import ProductSingle from '../../components/ProductSingle/ProductSingle.jsx'
import Reveal from '../../components/maison/Reveal.jsx'
import { Gallery, QtyStepper, WeightPicker } from '../../components/Purchase/Purchase.jsx'
import { PRODUCT_THEMES } from '../../components/Purchase/theme.js'
import usePurchase from '../../hooks/usePurchase.js'
import { getProduct, productGallery, relatedProducts } from '../../data/products.js'
import { formatPrice } from '../../data/houses.js'
import { loadLive, useLive } from '../../data/live.js'
import { Block, Lines, SkeletonGroup } from '../../components/Skeleton/Skeleton.jsx'
import { useT } from '../../i18n/lang.js'

const ease = [0.22, 1, 0.36, 1]

const SERVICES = [
  { kicker: 'Livraison', text: 'Gombe, le jour même, 4 $' },
  { kicker: 'Retrait', text: 'En boutique, gratuit, dès 9h00' },
  { kicker: 'Paiement', text: 'Mobile money ou carte bancaire' },
]

/**
 * Fiche produit (#produit/<id>), même gabarit pour les 4 Maisons :
 * galerie (vignettes, zoom au survol) · colonne d'achat collée (poids, quantité, « C'est pour offrir »,
 * panier, WhatsApp, services, accordéons) · bande éditoriale Patchi · « Vous aimerez aussi »
 * · barre d'achat collée en bas de l'écran sur mobile.
 */
export default function ProductPage({ id, onAdd, onBuyNow }) {
  const t = useT()
  const live = useLive()
  const product = getProduct(id)

  if (!product) {
    // Catalogue réel pas encore chargé, injoignable, ou produit inconnu
    const loading = live.status === 'idle' || live.status === 'loading'
    // Chargement : la fiche se dessine tout de suite (galerie + achat) ; le contenu la remplacera
    if (loading) {
      return (
        <SkeletonGroup label={t('Chargement du produit…')} className="min-h-[60svh] bg-white text-ink">
          <div className="px-gutter pt-6">
            <Block className="h-3 w-48 rounded-full" />
          </div>
          <div className="flex flex-wrap items-start gap-[clamp(32px,5vw,72px)] px-gutter pb-[clamp(72px,8vw,112px)] pt-6">
            <Block className="aspect-square min-w-0 flex-[999_1_560px] rounded-none" />
            <div className="flex max-w-[480px] flex-[1_1_380px] flex-col gap-6">
              <Block className="h-2.5 w-40 rounded-full" />
              <Block className="h-10 w-4/5" />
              <Lines count={3} />
              <Block className="h-9 w-32" />
              <Block className="h-14 w-full rounded-none" />
            </div>
          </div>
        </SkeletonGroup>
      )
    }
    return (
      <div className="grid min-h-[60svh] place-items-center bg-white px-gutter text-center text-ink">
        <div className="max-w-md">
          {live.status === 'error' ? (
            <>
              <p className="text-[18px]">{t('Impossible de charger ce produit.')}</p>
              <p className="mt-2 text-[14px] text-ink/60">{live.error?.message}</p>
              <button type="button" onClick={loadLive} className="caps mt-6 border-b border-ink pb-1">{t('Réessayer')}</button>
            </>
          ) : (
            <>
              <p className="text-[18px]">{t('Ce produit n’est plus disponible.')}</p>
              <a href="#maison/patchi" className="caps mt-6 inline-block border-b border-ink pb-1">{t('Voir la Maison Patchi')}</a>
            </>
          )}
        </div>
      </div>
    )
  }
  return <ProductView key={product.id} product={product} onAdd={onAdd} onBuyNow={onBuyNow} />
}

function ProductView({ product, onAdd, onBuyNow }) {
  const t = useT()
  const theme = PRODUCT_THEMES[product.maison]
  const buy = usePurchase(product, onAdd)
  const photos = productGallery(product)
  const related = relatedProducts(product)
  const isPatchi = product.maison === 'patchi'

  const description = [t(product.desc), product.ref && `${t('Réf.')} ${product.ref}`, product.store && `${t('Collection')} ${t(product.store)}`].filter(Boolean).join(' · ')
  const panels = [
    {
      title: t('Description'),
      content: isPatchi
        ? `${description}. ${product.byWeight ? t('Vendu au poids : 250 g, 500 g ou 1 kg.') : ''} ${t('[Notes de dégustation à fournir par Patchi]')}`
        : description || t('[Description à fournir]'),
    },
    ...(isPatchi
      ? [
          { title: t('Ingrédients et allergènes'), content: t('[Liste des ingrédients et allergènes à fournir par Patchi]') },
          { title: t('Conservation'), content: t('[Conseils de conservation à fournir par Patchi]') },
        ]
      : []),
    { title: t('Livraison et retrait'), content: t('Livraison à Gombe le jour même, à moto, 4 $. Retrait en boutique gratuit, dès 9h00. Paiement en ligne par mobile money ou carte bancaire.') },
  ]

  const unavailableLabel = buy.comingSoon ? t('Bientôt disponible') : buy.unitPrice == null ? t('Prix à venir') : t('Épuisé')
  const addLabel = !buy.available ? unavailableLabel : buy.added ? t('Ajouté au panier ✓') : `${t('Ajouter au panier')} · ${formatPrice(buy.total)}`

  return (
    <div data-fly-scope className="bg-white text-ink [--card:#ffffff] [--fg:var(--color-ink)]">
      {/* Fil d'Ariane */}
      <nav aria-label={t('Fil d’Ariane')} className="px-gutter pt-6 text-[12px] text-ink/60">
        <a href={`#maison/${product.maison}`} className="hover:text-ink">{product.house.name}</a>
        {product.store && <> / <span>{t(product.store)}</span></>} / <span className="text-ink">{t(product.name)}</span>
      </nav>

      {/* ============ Galerie + achat ============ */}
      <section className="flex flex-wrap items-start gap-[clamp(32px,5vw,72px)] px-gutter pb-[clamp(72px,8vw,112px)] pt-6">
        <m.div className="min-w-0 flex-[999_1_560px]" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <Gallery product={product} photos={photos} tone={theme.tone} />
        </m.div>

        <m.div
          className="flex max-w-[480px] flex-[1_1_380px] flex-col gap-6 md:sticky md:top-24"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
        >
          <div>
            <p className={`caps ${theme.eyebrow}`}>
              {product.house.name}
              {product.store ? ` · ${t(product.store)}` : ''}
              {product.ref ? ` · ${t('Réf.')} ${product.ref}` : ''}
            </p>
            <h1 className="mt-3 text-[clamp(32px,3.4vw,46px)] font-light leading-[1.08] tracking-[-0.015em]">{t(product.name)}</h1>
            {product.desc && <p className="mt-3 text-[15px] leading-[1.7] text-ink/75">{t(product.desc)}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-[34px] font-light">{buy.comingSoon ? t('Bientôt disponible') : formatPrice(buy.unitPrice)}</span>
            {buy.byWeight && buy.variant && <span className="text-[12px] text-ink/60">{t('pour {w}', { w: buy.variant.label })}</span>}
          </div>

          {buy.byWeight && <WeightPicker variants={buy.variants} value={buy.variant?.id} onChange={buy.setVariant} solid={theme.solid} />}

          {/* C'est pour offrir */}
          {buy.available && (
            <div className={`rounded-xl p-4 ${theme.tone}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={buy.gift} onChange={(e) => buy.setGift(e.target.checked)} className="mt-1 accent-current" />
                <span>
                  <span className="block text-[14px]">{t('C’est pour offrir')}</span>
                  <span className="block text-[12px] text-ink/65">{t('Un mot glissé dans la boîte · emballage cadeau [à confirmer]')}</span>
                </span>
              </label>
              {buy.gift && (
                <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
                  <label htmlFor="mot-produit" className="mb-2 mt-4 block text-[12px]">{t('Votre mot (120 caractères)')}</label>
                  <input
                    id="mot-produit"
                    type="text"
                    maxLength={120}
                    value={buy.note}
                    onChange={(e) => buy.setNote(e.target.value)}
                    placeholder={t('Joyeux anniversaire…')}
                    className="w-full rounded-lg border border-ink/25 bg-white px-4 py-3 text-[14px] outline-none focus:border-ink"
                  />
                </m.div>
              )}
            </div>
          )}

          {/* Quantité + panier */}
          <div className="flex gap-2.5">
            {buy.available && <QtyStepper value={buy.qty} onChange={buy.setQty} />}
            <m.button
              type="button"
              onClick={buy.add}
              disabled={!buy.available}
              whileTap={{ scale: 0.98 }}
              className={`h-[54px] flex-1 rounded-full text-[14px] disabled:cursor-not-allowed disabled:opacity-50 ${theme.solid}`}
            >
              {addLabel}
            </m.button>
          </div>
          {/* Commander maintenant : cet article seul, directement vers la page de commande */}
          <button
            type="button"
            onClick={() => buy.buyNow(onBuyNow)}
            disabled={!buy.available}
            className="flex h-[52px] items-center justify-center rounded-full border border-ink text-[14px] transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('Commander maintenant')}
          </button>

          {/* Services */}
          <div className="grid grid-cols-3 gap-2.5">
            {SERVICES.map((s) => (
              <div key={s.kicker} className="rounded-xl border border-ink/10 p-3.5">
                <p className="caps text-[9px] text-gold">{t(s.kicker)}</p>
                <p className="mt-1.5 text-[12px] leading-snug">{t(s.text)}</p>
              </div>
            ))}
          </div>
          {product.live && !buy.comingSoon && (
            <p className="flex items-center gap-2 text-[12px]">
              <span className={`size-[7px] rounded-full ${product.available ? 'bg-[#3f8a4f]' : 'bg-[#b8382c]'}`} />
              {!product.available
                ? t('Épuisé pour le moment')
                : product.byWeight
                  ? t('{n} kg en stock à Gombe', { n: product.stockKg })
                  : t('{n} en stock à Gombe', { n: buy.variant?.stock ?? product.stock })}
            </p>
          )}

          <Accordion items={panels} />
        </m.div>
      </section>

      {/* ============ Bande éditoriale (Patchi) ============ */}
      {isPatchi && (
        <section className="grid grid-cols-[1.2fr_1fr] bg-forest-deep text-paper max-md:grid-cols-1">
          {/* Volet de gauche à droite ; le déclencheur est le conteneur (un élément entièrement masqué n'est jamais « visible ») */}
          <m.div className="min-h-[420px]" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <m.img
              src="/img/products/patchi/Chocolate Milk Filled with Praline/Chocolate Milk Filled with Praline 3.webp"
              alt=""
              className="size-full min-h-[420px] object-cover"
              variants={{ hidden: { clipPath: 'inset(0% 100% 0% 0%)' }, show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.2, ease } } }}
            />
          </m.div>
          <div className="flex flex-col justify-center px-[clamp(32px,5vw,80px)] py-[clamp(48px,6vw,96px)]">
            <Reveal as="p" className="caps text-gold">{t('Le geste Patchi')}</Reveal>
            <Reveal as="h2" delay={0.1} className="mt-4 text-[clamp(30px,3.4vw,46px)] font-light leading-[1.12]">
              {t('Une praline se choisit')} <span className="accent">{t('une à une')}</span>{t(', puis se compose.')}
            </Reveal>
            <p className="mt-5 max-w-[420px] text-[14px] leading-[1.75] text-paper/80">{t('Mélangez les pralines Patchi pour composer un coffret sur mesure, du petit au grand format.')}</p>
            <a href="#maison/patchi" className="caps mt-7 self-start border-b border-gold pb-1.5">{t('Composer un coffret')} ⟶</a>
          </div>
        </section>
      )}

      {/* ============ Vous aimerez aussi ============ */}
      {related.length > 0 && (
        <section className={`px-gutter py-[clamp(72px,8vw,120px)] ${theme.tone} [--card:#ffffff]`}>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <Reveal as="h2" className="text-[clamp(32px,4vw,56px)] font-light">
              {t('Vous aimerez')} <span className="accent">{t('aussi')}</span>
            </Reveal>
            <a href={`#maison/${product.maison}`} className="caps border-b border-current pb-1">{t('Toute la Maison {m}', { m: product.house.name })}</a>
          </div>
          <div className="mt-10 grid grid-cols-4 gap-6 max-[1000px]:grid-cols-2">
            {related.map((p, i) => (
              <m.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: i * 0.07, ease }}>
                <ProductSingle product={p} onAdd={onAdd} />
              </m.div>
            ))}
          </div>
        </section>
      )}

      {/* ============ Mobile : barre d'achat collée en bas ============ */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-ink/10 bg-white/95 px-4 pb-5 pt-3 backdrop-blur md:hidden">
        <div className="shrink-0">
          <p className="text-[20px] font-light leading-none">{buy.available ? formatPrice(buy.total) : buy.comingSoon ? t('Bientôt') : '—'}</p>
          {buy.byWeight && buy.variant && <p className="mt-1 text-[11px] text-ink/60">{buy.variant.label}</p>}
        </div>
        <button type="button" onClick={buy.add} disabled={!buy.available} aria-label={t('Ajouter au panier')} className="grid h-12 shrink-0 place-items-center rounded-full border border-ink px-4 text-[13px] disabled:opacity-40">
          {buy.added ? '✓' : t('+ Panier')}
        </button>
        <button type="button" onClick={() => buy.buyNow(onBuyNow)} disabled={!buy.available} className={`h-12 flex-1 rounded-full text-[14px] disabled:opacity-50 ${theme.solid}`}>
          {!buy.available ? unavailableLabel : t('Commander maintenant')}
        </button>
      </div>
      <div className="h-24 md:hidden" aria-hidden />
    </div>
  )
}
