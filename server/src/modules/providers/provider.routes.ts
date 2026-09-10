/**
 * modules/providers/provider.routes.ts
 */

import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { createProviderSchema, updateProviderSchema, providerListQuery, providerIdParam } from './provider.validation'
import { providerController } from './provider.controller'

export const providerRouter = Router()
providerRouter.use(authenticate)

providerRouter.get('/', validate({ query: providerListQuery }), requirePermission('providers.view_all'), providerController.list)
providerRouter.get('/:id', validate({ params: providerIdParam }), requirePermission('providers.view_all'), providerController.get)
providerRouter.get('/:id/services', validate({ params: providerIdParam }), requirePermission('providers.view_all'), providerController.services)
providerRouter.post('/', validate({ body: createProviderSchema }), requirePermission('providers.create'), providerController.create)
providerRouter.patch('/:id', validate({ params: providerIdParam, body: updateProviderSchema }), requirePermission('providers.edit'), providerController.update)
providerRouter.delete('/:id', validate({ params: providerIdParam }), requirePermission('providers.delete'), providerController.remove)
