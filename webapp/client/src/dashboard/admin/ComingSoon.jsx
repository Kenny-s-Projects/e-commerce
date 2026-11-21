import { ADMIN_MENU } from '../layouts/AdminLayout.jsx'
import { Card, PageTitle } from '../ui/ui.jsx'
import Icon from '../ui/Icon.jsx'
import { tr } from '../lib/i18n.js'

// Rubrique du menu pas encore maquettée
export default function ComingSoon({ section }) {
  const item = ADMIN_MENU.find((m) => m.id === section) ?? { label: 'Rubrique', icon: 'settings' }
  return (
    <>
      <PageTitle eyebrow={tr('Super admin')} before={tr(item.label)} />
      <Card className="mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-d-soft">
          <Icon name={item.icon} className="size-5" />
        </span>
        <p className="text-[17px]">{tr('Cette rubrique arrive bientôt.')}</p>
        <p className="max-w-md text-sm text-d-muted">{tr('Elle sera ajoutée quand sa maquette sera prête. En attendant, la vue d’ensemble, les commandes et le dispatch sont disponibles.')}</p>
        <a href="#admin" className="mt-2 text-[13px] underline decoration-d-border underline-offset-4">{tr('Retour à la vue d’ensemble')}</a>
      </Card>
    </>
  )
}
