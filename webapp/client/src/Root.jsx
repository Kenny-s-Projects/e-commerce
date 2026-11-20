import { lazy, Suspense, useEffect, useState } from 'react'
import { LazyMotion, MotionConfig } from 'framer-motion'
import App from './App.jsx'
import useLiteMode, { LiteModeProvider } from './hooks/useLiteMode.js'

// Le dashboard (admin, employé, livreur) est chargé à part : le site reste léger pour les clients.
const Dashboard = lazy(() => import('./dashboard/DashboardApp.jsx'))

// Fonctions d'animation chargées après le premier affichage (composants « m » de Framer Motion)
const loadMotionFeatures = () => import('./lib/motionFeatures.js').then((mod) => mod.default)

const DASHBOARD_ROOTS = ['dashboard', 'admin', 'employe', 'livreur', 'connexion']
const isDashboard = () => DASHBOARD_ROOTS.includes(window.location.hash.slice(1).split('/')[0])

export default function Root() {
  return (
    <LiteModeProvider>
      <Motion>
        <Spaces />
      </Motion>
    </LiteModeProvider>
  )
}

/*
 * Animations :
 *  - réglage système « Réduire les animations » respecté partout (site et dashboard) ;
 *  - mode léger : les déplacements sont coupés, seuls les fondus restent.
 */
function Motion({ children }) {
  const lite = useLiteMode()
  return (
    <MotionConfig reducedMotion={lite ? 'always' : 'user'}>
      <LazyMotion features={loadMotionFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}

function Spaces() {
  const [dashboard, setDashboard] = useState(isDashboard)
  useEffect(() => {
    const onChange = () => setDashboard(isDashboard())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  if (!dashboard) return <App />
  return (
    <Suspense fallback={<div className="grid min-h-svh place-items-center bg-d-bg font-sans text-sm text-d-muted">Chargement…</div>}>
      <Dashboard />
    </Suspense>
  )
}
