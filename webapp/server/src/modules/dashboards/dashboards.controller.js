import * as service from './dashboards.service.js'

export const client = async (req, res) => res.json(await service.client(req))
export const employee = async (req, res) => res.json(await service.employee(req))
export const rider = async (req, res) => res.json(await service.rider(req))
export const admin = async (req, res) => res.json(await service.admin(req))
