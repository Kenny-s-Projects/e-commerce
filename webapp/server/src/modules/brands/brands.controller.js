import * as service from './brands.service.js'

export const list = async (req, res) => res.json(await service.list())
export const get = async (req, res) => res.json(await service.get(req.valid.params.slug))
export const update = async (req, res) => res.json(await service.update(req.valid.params.slug, req.valid.body))
export const hours = async (req, res) => res.json(await service.hours(req.valid.params.slug))
export const updateHours = async (req, res) =>
  res.json(await service.updateHours(req.user, req.valid.params.slug, req.valid.body.hours))
