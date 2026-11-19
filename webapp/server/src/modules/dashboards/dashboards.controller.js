import * as service from './dashboards.service.js'

export const admin = async (req, res) => res.json(await service.admin())
