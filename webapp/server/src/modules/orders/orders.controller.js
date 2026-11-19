import * as service from './orders.service.js'

export const create = async (req, res) => res.status(201).json(await service.placeOrder(req.user, req.valid.body))
export const mine = async (req, res) => res.json(await service.listMyOrders(req.user, req.valid.query.tab))
export const show = async (req, res) => res.json(await service.getOrder(req.user, req.valid.params.id))
export const cancel = async (req, res) =>
  res.json(await service.cancelOrder(req.user, req.valid.params.id, req.valid.body?.reason))
