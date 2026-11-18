// Couleurs de chaque Maison sur la fiche produit et l'aperçu rapide
export const PRODUCT_THEMES = {
  kyra: { tone: 'bg-kyra-card', solid: 'bg-kyra-ink text-white', eyebrow: 'text-kyra' },
  patchi: { tone: 'bg-paper', solid: 'bg-forest-deep text-paper', eyebrow: 'text-forest' },
  adidas: { tone: 'bg-[#f3f3f1]', solid: 'bg-black text-white', eyebrow: 'text-black/60' },
  celio: { tone: 'bg-[#f3f2ef]', solid: 'bg-ink text-white', eyebrow: 'text-celio' },
}

// Photo détourée (Kyra) → « contain » sur fond clair ; vraie photo ou visuel Patchi → plein cadre
export const photoFit = (p) => (p.images || p.boxed ? 'size-full object-cover' : 'size-[78%] object-contain mix-blend-multiply')
