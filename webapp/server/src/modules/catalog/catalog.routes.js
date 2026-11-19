import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import * as controller from './catalog.controller.js'
import { brandsQuery, listProductsQuery, productParams } from './catalog.schemas.js'

// Catalogue public (pas de connexion nécessaire)
export const catalogRoutes = Router()

catalogRoutes.get('/brands', validate({ query: brandsQuery }), controller.brands)            // brands + rayons (?brand=patchi)
catalogRoutes.get('/products', validate({ query: listProductsQuery }), controller.products)  // ?brand=&category=&tag=&search=&inStock=&sort=
catalogRoutes.get('/products/:slug', validate({ params: productParams }), controller.product) // fiche + produits liés
