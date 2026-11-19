import * as service from './catalog.service.js'

// Lit la requête, appelle le service, renvoie la réponse. Rien d'autre.

export const brands = async (req, res) => res.json(await service.listBrands(req.valid.query.brand))
export const products = async (req, res) => res.json(await service.listProducts(req.valid.query))
export const product = async (req, res) => res.json(await service.getProduct(req.valid.params.slug))
