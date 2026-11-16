// Le préchargeur ne s'affiche qu'une fois par session (onglet).
const STORAGE_KEY = 'kclick-intro-seen'

export function hasSeenIntro() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false // navigation privée ou stockage bloqué : on affiche le préchargeur
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* stockage indisponible : on ignore */
  }
}
