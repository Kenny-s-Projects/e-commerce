// Suivi sans compte : le téléphone de chaque commande passée sur cet appareil, pour /orders/track/:number?phone=
const KEY = 'kclick-last-order'

const read = () => {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return all && typeof all === 'object' ? all : {}
  } catch {
    return {}
  }
}

export const phoneFor = (number) => read()[number] ?? ''

export function rememberOrder(number, phone) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [number]: phone, last: number }))
  } catch {
    /* stockage indisponible : le suivi demandera le téléphone */
  }
}
