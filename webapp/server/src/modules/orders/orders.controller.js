import * as service from './orders.service.js'

export const create = async (req, res) => res.status(201).json(await service.placeOrder(req.user, req.valid.body))
export const list = async (req, res) => res.json(await service.listAll(req.valid.query))
export const mine = async (req, res) => res.json(await service.listMyOrders(req.user, req.valid.query.tab))
export const track = async (req, res) => res.json(await service.track(req.valid.params.number, req.valid.query.phone))
export const show = async (req, res) => res.json(await service.getOrder(req.user, req.valid.params.id))
export const cancel = async (req, res) =>
  res.json(await service.cancelOrder(req.user, req.valid.params.id, req.valid.body?.reason))
export const handover = async (req, res) => res.json(await service.handover(req.user, req.valid.params.id))
