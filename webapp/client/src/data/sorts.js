// Options de tri de la grille produit (page Maison)
export const SORTS = [
  { id: 'selection', label: 'Sélection' },
  { id: 'price-asc', label: 'Prix croissant' },
  { id: 'price-desc', label: 'Prix décroissant' },
  { id: 'name', label: 'Nom, A → Z' },
]

// Fonctions de comparaison correspondantes (les produits sans prix vont à la fin)
export const sorters = {
  selection: () => 0,
  'price-asc': (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
  'price-desc': (a, b) => (b.price ?? -1) - (a.price ?? -1),
  name: (a, b) => a.name.localeCompare(b.name, 'fr'),
}
