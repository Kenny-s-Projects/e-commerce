import * as service from './deliveries.service.js'

export const riders = async (req, res) => res.json(await service.riders())
export const assign = async (req, res) => res.status(201).json(await service.assign(req.user, req.valid.body))
export const mine = async (req, res) => res.json(await service.mine(req.user))
export const collect = async (req, res) => res.json(await service.collect(req.user, req.valid.params.orderId, req.valid.body.brand))
export const delivered = async (req, res) => res.json(await service.delivered(req.user, req.valid.params.orderId))
export const availability = async (req, res) => res.json(await service.availability(req.user, req.valid.body.available))
