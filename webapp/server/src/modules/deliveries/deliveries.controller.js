import * as service from './deliveries.service.js'

export const mine = async (req, res) => res.json(await service.mine(req))
export const assign = async (req, res) => res.json(await service.assign(req))
export const delivered = async (req, res) => res.json(await service.delivered(req))
export const cash = async (req, res) => res.json(await service.cash(req))
export const confirmCash = async (req, res) => res.json(await service.confirmCash(req))
