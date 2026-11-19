import * as service from './parts.service.js'

export const listForBrand = async (req, res) => res.json(await service.listForBrand(req.user, req.valid.query))
export const setStatus = async (req, res) => res.json(await service.setStatus(req.user, req.valid.params.id, req.valid.body))
