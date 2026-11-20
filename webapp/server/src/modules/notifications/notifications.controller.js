import * as service from './notifications.service.js'

export const list = async (req, res) => res.json(await service.list(req))
export const markRead = async (req, res) => res.json(await service.markRead(req))
export const emails = async (req, res) => res.json(await service.listEmails(req.valid.query))
export const retryEmail = async (req, res) => res.json(await service.retryEmail(req.valid.params.id))
