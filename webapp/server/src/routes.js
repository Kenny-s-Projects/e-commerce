import { Router } from 'express'
import { catalogRoutes } from './modules/catalog/catalog.routes.js'
import { brandsRoutes } from './modules/brands/brands.routes.js'
import { ordersRoutes } from './modules/orders/orders.routes.js'
import { partsRoutes } from './modules/parts/parts.routes.js'
import { deliveriesRoutes } from './modules/deliveries/deliveries.routes.js'
import { paymentsRoutes } from './modules/payments/payments.routes.js'
import { notificationsRoutes } from './modules/notifications/notifications.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { dashboardsRoutes } from './modules/dashboards/dashboards.routes.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { clientsRoutes } from './modules/clients/clients.routes.js'
import { settingsRoutes } from './modules/settings/settings.routes.js'

// Toutes les routes de l'API, préfixées par /api/v1 (voir app.js)
export const routes = Router()

routes.use('/catalog', catalogRoutes)
routes.use('/brands', brandsRoutes)
routes.use('/orders', ordersRoutes)
routes.use('/parts', partsRoutes)
routes.use('/deliveries', deliveriesRoutes)
routes.use('/payments', paymentsRoutes)
routes.use('/notifications', notificationsRoutes)
routes.use('/users', usersRoutes)
routes.use('/dashboards', dashboardsRoutes)
routes.use('/auth', authRoutes)
routes.use('/clients', clientsRoutes)
routes.use('/settings', settingsRoutes)
