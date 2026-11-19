import { query } from '../../config/db.js'
import { badRequest } from '../../shared/errors.js'
import { SECTIONS } from './settings.schemas.js'

// Paramètres de la plateforme (super admin). Le checkout lit une version publique réduite.

export async function getAll() {
  const { rows } = await query('select key, value, updated_at from public.app_settings')
  return Object.fromEntries(rows.map((r) => [r.key, { ...r.value, updatedAt: r.updated_at }]))
}

export async function getSection(section) {
  const { rows } = await query('select value from public.app_settings where key = $1', [section])
  return rows[0]?.value ?? null
}

/** Remplace une rubrique, après vérification (le paiement à la livraison reste toujours désactivé) */
export async function update(user, section, body) {
  const parsed = SECTIONS[section].safeParse(body)
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    throw badRequest('VALIDATION_FAILED', 'Paramètres invalides', details)
  }
  const { rows } = await query(
    `insert into public.app_settings (key, value, updated_by, updated_at) values ($1, $2, $3, now())
     on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()
     returning value, updated_at`,
    [section, JSON.stringify(parsed.data), user.id],
  )
  return { ...rows[0].value, updatedAt: rows[0].updated_at }
}

const OPERATORS = [['mpesa', 'M-Pesa'], ['orange', 'Orange Money'], ['airtel', 'Airtel Money']]

/** Pour le site (checkout, aide) : zones de livraison actives, heure limite, contacts, moyens de paiement */
export async function publicSettings() {
  const all = await getAll()
  const { delivery = {}, general = {}, payments = {} } = all
  return {
    delivery: {
      zones: (delivery.zones ?? []).filter((z) => z.active).map(({ commune, fee, delay }) => ({ commune, fee, delay })),
      sameDayCutoff: delivery.sameDayCutoff ?? null,
    },
    contact: { supportEmail: general.supportEmail ?? null, whatsapp: general.whatsapp ?? null, address: general.address ?? null },
    payments: {
      mobileMoney: payments.mobileMoney?.enabled ? OPERATORS.filter(([k]) => payments.mobileMoney.operators?.[k]).map(([, label]) => label) : [],
      card: Boolean(payments.card?.enabled),
      cashOnDelivery: false,
    },
  }
}
