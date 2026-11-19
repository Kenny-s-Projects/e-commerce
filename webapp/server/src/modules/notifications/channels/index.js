// Chaque canal respecte la même interface : send({ to, title, body })
// app : enregistrée en base, lue dans les dashboards. whatsapp / sms : prestataire à brancher.
import * as app from './app.js'
import * as whatsapp from './whatsapp.js'
import * as sms from './sms.js'

export const channels = { app, whatsapp, sms }
