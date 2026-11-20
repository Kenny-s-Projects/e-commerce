import { useEffect, useSyncExternalStore } from 'react'
import { api } from '../lib/api.js'
import { addTranslations } from '../i18n/lang.js'

/*
 * Catalogue réel (API Express) : Maisons ouvertes ou non, et produits des Maisons en vente.
 * Aujourd'hui seule Patchi est en vente ; Kyra, adidas et Celio gardent leurs textes et photos du site
 * mais leurs produits restent « Bientôt disponible » tant que l'API ne les propose pas.
 * Ouvrir une Maison dans Paramètres › Maisons la rend achetable ici dès qu'elle a des produits dans l'API.
 */

export const PATCHI_PLACEHOLDER = '/img/logos/patchi-placeholder.png'
const LIVE_BRANDS = ['patchi'] // Maisons dont les produits viennent de l'API

let state = { status: 'idle', error: null, brands: {}, products: [], bySlug: new Map() }
const listeners = new Set()
const emit = (next) => {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Produit de l'API → forme attendue par les composants du site */
export function toSiteProduct(p) {
  const kg = p.unit === 'kg'
  const images = (p.images ?? []).map((i) => i.url).filter(Boolean)
  const variants = (p.variants ?? []).map((v) => ({
    id: v.id,
    label: v.label,
    price: v.price,
    stock: v.stock,
    grams: v.weight_grams,
    inStock: v.in_stock,
    available: v.available,
  }))
  return {
    id: p.slug,
    slug: p.slug,
    ref: p.ref,
    live: true,
    name: p.name_fr,
    nameEn: p.name_en,
    desc: p.description_fr,
    descEn: p.description_en,
    cat: p.category,
    store: p.category_fr ?? '',
    storeEn: p.category_en,
    price: p.price_from, // prix « à partir de » (250 g pour les produits au poids)
    priceFrom: kg,
    unit: null,
    byWeight: kg,
    stock: p.stock,
    stockKg: p.stock_kg,
    variants,
    available: p.available,
    comingSoon: p.coming_soon,
    images: images.length ? images : [PATCHI_PLACEHOLDER],
    img: images[0] ?? PATCHI_PLACEHOLDER,
    hasPhoto: images.length > 0,
    boxed: true,
    maison: p.brand,
    house: { id: p.brand, name: p.brand_name ?? p.brand },
  }
}

export async function loadLive() {
  if (state.status === 'loading') return
  emit({ status: 'loading', error: null })
  try {
    const [brands, ...lists] = await Promise.all([
      api.get('/catalog/brands', undefined, { auth: false }),
      ...LIVE_BRANDS.map((b) => api.get('/catalog/products', { brand: b, limit: 100 }, { auth: false })),
    ])
    const products = lists.flatMap((l) => l.items.map(toSiteProduct))
    // Les noms anglais viennent de la base : on les ajoute au dictionnaire pour que t(nom) les traduise
    addTranslations(products.flatMap((p) => [[p.name, p.nameEn], [p.store, p.storeEn], [p.desc, p.descEn]]))
    emit({
      status: 'ready',
      brands: Object.fromEntries(brands.map((b) => [b.slug, b])),
      products,
      bySlug: new Map(products.map((p) => [p.slug, p])),
    })
  } catch (error) {
    emit({ status: 'error', error })
  }
}

/** État du catalogue réel : { status, error, brands, products, bySlug } — charge au premier appel */
export function useLive() {
  const snap = useSyncExternalStore(subscribe, () => state)
  useEffect(() => {
    if (state.status === 'idle') loadLive()
  }, [])
  return snap
}

export const liveState = () => state
export const isLiveBrand = (slug) => LIVE_BRANDS.includes(slug)

/** Une Maison est-elle ouverte à la vente ? (inconnu tant que l'API n'a pas répondu → fermée) */
export const brandOpen = (slug) => state.brands[slug]?.is_open === true

/** Un produit peut-il être acheté ? Seulement s'il vient de l'API, Maison ouverte et en stock */
export const isPurchasable = (product) => Boolean(product?.live && product.available && brandOpen(product.maison))

/** Variante proposée par défaut : la première disponible, sinon la première */
export const defaultVariant = (product) => product?.variants?.find((v) => v.available) ?? product?.variants?.[0] ?? null

/**
 * Ligne de panier : une variante (un poids, ou « Standard ») avec son mot cadeau éventuel.
 * La clé (id) distingue deux fois le même article avec des mots cadeau différents.
 */
export function cartLine(product, variant, giftMessage = '') {
  const gift = giftMessage.trim()
  const label = variant.label && variant.label !== 'Standard' ? variant.label : null
  return {
    id: `${variant.id}${gift ? `|${gift}` : ''}`,
    variantId: variant.id,
    productId: product.slug ?? product.id,
    productName: product.name,
    variantLabel: label,
    name: label ? `${product.name} · ${label}` : product.name,
    giftMessage: gift,
    price: variant.price,
    img: product.img,
    images: product.images,
    boxed: product.boxed,
    store: product.store,
    maison: product.maison,
    house: product.house,
    live: true,
  }
}

/** Produit à jour (catalogue réel) pour un slug, ou null */
export const liveProduct = (slug) => state.bySlug.get(slug) ?? null

/** Fiche produit complète (avec produits liés) */
export async function fetchProduct(slug) {
  const p = await api.get(`/catalog/products/${encodeURIComponent(slug)}`, undefined, { auth: false })
  return { ...toSiteProduct(p), related: (p.related ?? []).map(toSiteProduct) }
}
