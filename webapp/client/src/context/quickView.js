import { createContext, useContext } from 'react'

// Ouvre l'aperçu rapide d'un produit depuis n'importe quelle carte : const open = useQuickView(); open(product)
export const QuickViewContext = createContext(() => {})

export const useQuickView = () => useContext(QuickViewContext)
