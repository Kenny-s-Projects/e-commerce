// Dictionnaire anglais : clé = texte français exact écrit dans le code, valeur = traduction.
// Un fichier par partie du site, pour s'y retrouver.
import core from './core.js'
import home from './home.js'
import maisons from './maisons.js'
import pages from './pages.js'

export default { ...home, ...maisons, ...pages, ...core }
