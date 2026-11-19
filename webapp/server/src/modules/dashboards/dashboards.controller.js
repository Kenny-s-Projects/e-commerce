import * as service from './dashboards.service.js'
import { getDashboardData } from './dashboards.model.js'

export const client = async (req, res) => res.json(await service.client(req))
export const employee = async (req, res) => res.json(await service.employee(req))
export const rider = async (req, res) => res.json(await service.rider(req))
export const admin = async (req, res) => res.json(await service.admin(req))

export const DashboardOverview = async (req, res) => {
  const data = await getDashboardData()
  if (!data) return res.status(404).json({ error: 'Dashboard not found' })
  res.json(data)
}
