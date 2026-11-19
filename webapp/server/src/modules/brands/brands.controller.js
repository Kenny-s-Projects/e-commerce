import * as service from './brands.service.js'

export const list = async (req, res) => res.json(await service.list(req))
export const hours = async (req, res) => res.json(await service.hours(req))
export const updateHours = async (req, res) => res.json(await service.updateHours(req))
