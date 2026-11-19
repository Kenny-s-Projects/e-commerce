import * as service from './parts.service.js'

export const listForBrand = async (req, res) => res.json(await service.listForBrand(req))
export const setStatus = async (req, res) => res.json(await service.setStatus(req))
