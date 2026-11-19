import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import * as controller from './catalog.controller.js'
import { listProductsQuery, productParams } from './catalog.schemas.js'

// Catalogue public (pas de connexion nécessaire)
export const catalogRoutes = Router()

catalogRoutes.get('/categories', controller.categories)                                      // ?brand=patchi
catalogRoutes.get('/products', validate({ query: listProductsQuery }), controller.products)  // ?brand=&category=&search=
catalogRoutes.get('/products/:slug', validate({ params: productParams }), controller.product)
