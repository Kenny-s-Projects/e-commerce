// Mise en forme : montants, heures, durées (en français, ou en anglais si le dashboard est en anglais)
import { isActivePart } from './status.js'
import { getLang } from './i18n.js'

const en = () => getLang() === 'en'

export const money = (n) => `$${Math.round(Number(n) * 100) / 100}`

export const hour = (date) => {
  const d = new Date(date)
  if (en()) return clock(d)
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`
}
export const clock = (date) => {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const minutesSince = (date, now = Date.now()) => Math.max(0, Math.round((now - new Date(date)) / 60000))

export const ago = (date, now) => {
  const m = minutesSince(date, now)
  if (en()) {
    if (m < 1) return 'just now'
    if (m < 60) return `${m} min ago`
    return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} ago`
  }
  if (m < 1) return 'à l’instant'
  if (m < 60) return `il y a ${m} min`
  return `il y a ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

export const since = (date, now) => {
  const m = minutesSince(date, now)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

export const today = () =>
  new Date().toLocaleDateString(en() ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())

export const initials = (name = '') =>
  String(name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const partTotal = (part) => part.items.reduce((acc, i) => acc + i.price * i.qty, 0)

export const orderSubtotal = (order) => order.parts.filter(isActivePart).reduce((acc, p) => acc + partTotal(p), 0)

export const orderTotal = (order) => {
  const sub = orderSubtotal(order)
  return sub ? sub + (order.mode === 'livraison' ? order.deliveryFee : 0) : 0
}

/** Langue des dates (toLocaleDateString) selon la langue du dashboard */
export const dateLocale = () => (en() ? 'en-US' : 'fr-FR')
