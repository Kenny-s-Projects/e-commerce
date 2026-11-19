import * as service from './users.service.js'

export const me = async (req, res) => res.json(await service.me(req))
export const updateMe = async (req, res) => res.json(await service.updateMe(req))
export const list = async (req, res) => res.json(await service.list(req))
export const addRole = async (req, res) => res.json(await service.addRole(req))
export const removeRole = async (req, res) => res.json(await service.removeRole(req))
