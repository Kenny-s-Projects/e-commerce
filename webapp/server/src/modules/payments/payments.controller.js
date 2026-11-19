import * as service from './payments.service.js'

export const list = async (req, res) => res.json(await service.list(req.valid.query))
export const confirm = async (req, res) => res.json(await service.confirm(req.user, req.valid.params.id, req.valid.body))
export const fail = async (req, res) => res.json(await service.fail(req.user, req.valid.params.id, req.valid.body))
export const refunds = async (req, res) => res.json(await service.refunds(req.valid.query))
export const refundDone = async (req, res) => res.json(await service.refundDone(req.user, req.valid.params.id, req.valid.body))
export const webhook = async (req, res) => res.json(await service.webhook(req.valid.params.provider, req))
