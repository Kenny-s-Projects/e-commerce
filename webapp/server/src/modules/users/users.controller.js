import * as service from './users.service.js'

export const me = async (req, res) => res.json(service.me(req.user))
export const updateMe = async (req, res) => res.json(await service.updateMe(req.user, req.valid.body))
export const list = async (req, res) => res.json(await service.list(req.valid.query))
export const get = async (req, res) => res.json(await service.get(req.valid.params.id))
export const invite = async (req, res) => res.status(201).json(await service.invite(req.user, req.valid.body))
export const update = async (req, res) => res.json(await service.update(req.user, req.valid.params.id, req.valid.body))
export const deactivate = async (req, res) => res.json(await service.setActive(req.user, req.valid.params.id, false))
export const reactivate = async (req, res) => res.json(await service.setActive(req.user, req.valid.params.id, true))
export const revoke = async (req, res) => res.json(await service.revokeInvitation(req.valid.params.id))
export const resend = async (req, res) => res.json(await service.resendInvitation(req.valid.params.id))
