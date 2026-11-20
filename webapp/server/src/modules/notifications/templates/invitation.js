// E-mail d'invitation d'un membre de l'équipe (super admin, employé d'une Maison, livreur)
import { env } from '../../../config/env.js'
import { box, button, esc, layout, p, title } from './layout.js'

const ROLE_LABELS = { super_admin: 'super admin', employe: 'employé(e)', livreur: 'livreur' }

export function invitation({ firstName, email, role, brandName }) {
  const loginUrl = `${env.PUBLIC_SITE_URL}/#connexion`
  const roleLabel = `${ROLE_LABELS[role] ?? role}${role === 'employe' && brandName ? ` de la Maison ${brandName}` : ''}`
  const html = layout({
    lang: 'fr',
    preheader: `Vous avez été ajouté(e) à kclick en tant que ${roleLabel}.`,
    body: `${title('Votre accès à kclick')}${p(`Bonjour ${esc(firstName || '')},`)}${p(
      `Vous avez été ajouté(e) à l’espace équipe de kclick en tant que <strong style="color:#141414;">${esc(roleLabel)}</strong>.`,
    )}${p('Pas de mot de passe : pour vous connecter, ouvrez l’espace équipe, saisissez votre adresse e-mail, puis le code à 6 chiffres que vous recevrez par e-mail.')}${box(
      `Votre adresse de connexion : <strong>${esc(email)}</strong>`,
    )}${button(loginUrl, 'Ouvrir l’espace équipe')}${p('Vous n’attendiez pas cette invitation ? Ignorez simplement cet e-mail.', 'font-size:13px;')}`,
  })
  const text = [
    'Votre accès à kclick',
    `Bonjour ${firstName || ''},`,
    `Vous avez été ajouté(e) à l’espace équipe de kclick en tant que ${roleLabel}.`,
    `Connectez-vous sur ${loginUrl} avec ${email} : vous recevrez un code à 6 chiffres par e-mail.`,
  ].join('\n')
  return { subject: 'Votre accès à kclick', html, text }
}
