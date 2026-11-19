import * as service from './payments.service.js'

export const webhook = async (req, res) => res.json(await service.webhook(req))
export const refunds = async (req, res) => res.json(await service.refunds(req))
export const refundDone = async (req, res) => res.json(await service.refundDone(req))
