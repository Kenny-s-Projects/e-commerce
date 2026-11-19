// Calculs de montants en centimes, pour éviter les erreurs d'arrondi (0.1 + 0.2).
export const toCents = (amount) => Math.round(Number(amount) * 100)
export const fromCents = (cents) => cents / 100
export const sum = (amounts) => fromCents(amounts.reduce((acc, a) => acc + toCents(a), 0))
export const multiply = (amount, qty) => fromCents(toCents(amount) * qty)
