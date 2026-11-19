import * as service from './catalog.service.js'

// Lit la requête, appelle le service, renvoie la réponse. Rien d'autre.

export async function categories(req, res) {
  res.json(await service.listCategories(req.query.brand))
}

export async function products(req, res) {
  res.json(await service.listProducts(req.valid.query))
}

export async function product(req, res) {
  res.json(await service.getProduct(req.valid.params.slug))
}
