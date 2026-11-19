import { lazy, Suspense, useEffect, useState } from 'react'
import App from './App.jsx'

// Le dashboard (admin, employé, livreur) est chargé à part : le site reste léger pour les clients.
const Dashboard = lazy(() => import('./dashboard/DashboardApp.jsx'))

const DASHBOARD_ROOTS = ['dashboard', 'admin', 'employe', 'livreur', 'connexion']
const isDashboard = () => DASHBOARD_ROOTS.includes(window.location.hash.slice(1).split('/')[0])

export default function Root() {
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
