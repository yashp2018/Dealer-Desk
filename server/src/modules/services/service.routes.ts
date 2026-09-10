/**
 * modules/services/service.routes.ts
 */

import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { createServiceSchema, updateServiceSchema, serviceListQuery, serviceIdParam } from './service.validation'
import { serviceController } from './service.controller'

export const serviceRouter = Router()
serviceRouter.use(authenticate)

serviceRouter.get('/', validate({ query: serviceListQuery }), requirePermission('services.view_all'), serviceController.list)
serviceRouter.get('/:id', validate({ params: serviceIdParam }), requirePermission('services.view_all'), serviceController.get)
serviceRouter.post('/', validate({ body: createServiceSchema }), requirePermission('services.create'), serviceController.create)
serviceRouter.patch('/:id', validate({ params: serviceIdParam, body: updateServiceSchema }), requirePermission('services.edit'), serviceController.update)
serviceRouter.delete('/:id', validate({ params: serviceIdParam }), requirePermission('services.delete'), serviceController.remove)
