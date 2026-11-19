import { z } from 'zod'

// Une rubrique des Paramètres = un schéma. Chaque enregistrement remplace la rubrique entière.

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure au format HH:MM')
const phone = z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, 'Téléphone invalide')

export const SECTIONS = {
  general: z.object({
    platform: z.string().trim().min(1).max(60),
    company: z.string().trim().min(1).max(120),
    supportEmail: z.email('E-mail invalide'),
    whatsapp: phone,
    address: z.string().trim().min(3).max(200),
    defaultLang: z.enum(['fr', 'en']),
    currency: z.literal('USD'),
  }),
  delivery: z.object({
    zones: z
      .array(
        z.object({
          commune: z.string().trim().min(2).max(60),
          fee: z.number().min(0).max(1000),
          delay: z.string().trim().min(2).max(60),
          active: z.boolean(),
        }),
      )
      .min(1, 'Au moins une zone de livraison')
      .refine((z) => new Set(z.map((x) => x.commune.toLowerCase())).size === z.length, 'Une commune apparaît deux fois'),
    sameDayCutoff: time,
    cancelWindowMinutes: z.number().int().min(0).max(1440),
  }),
  payments: z.object({
    mobileMoney: z.object({
      enabled: z.boolean(),
      operators: z.object({ mpesa: z.boolean(), orange: z.boolean(), airtel: z.boolean() }),
    }),
    card: z.object({ enabled: z.boolean() }),
    // Pas de paiement à la livraison : toujours désactivé, quelle que soit la valeur envoyée
    cashOnDelivery: z.any().optional().transform(() => false),
    provider: z.string().trim().max(60).nullable(),
  }).refine((p) => p.mobileMoney.enabled || p.card.enabled, 'Au moins un moyen de paiement en ligne doit rester actif'),
  notifications: z.object({
    customerEmails: z.object({ confirmation: z.boolean(), ready: z.boolean(), onTheWay: z.boolean(), delivered: z.boolean() }),
    teamRecipients: z.array(z.email('E-mail invalide')).min(1, 'Au moins un destinataire').max(10),
    newOrderSound: z.boolean(),
  }),
  security: z.object({
    codeValidityMinutes: z.number().int().min(5).max(60),
    idleLogoutMinutes: z.number().int().min(15).max(1440),
  }),
}

export const sectionParams = z.object({ section: z.enum(Object.keys(SECTIONS)) })
