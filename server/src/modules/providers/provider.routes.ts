/**
 * modules/providers/provider.routes.ts
 */

import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/permissions/permissions.service'
import {
  validateCreateProvider,
  validateUpdateProvider,
  validateProviderListQuery,
  validateProviderId,
} from './provider.validation'
import {
  handleListProviders,
  handleGetProvider,
  handleCreateProvider,
  handleUpdateProvider,
  handleDeleteProvider,
  handleGetProviderServices,
} from './provider.controller'

const router = Router()

router.use(authenticate)

router.get('/', validateProviderListQuery, requirePermission('read', 'providers'), handleListProviders)
router.get('/:id', validateProviderId, requirePermission('read', 'providers'), handleGetProvider)
router.get('/:id/services', validateProviderId, requirePermission('read', 'providers'), handleGetProviderServices)
router.post('/', validateCreateProvider, requirePermission('create', 'providers'), handleCreateProvider)
router.patch('/:id', validateUpdateProvider, requirePermission('update', 'providers'), handleUpdateProvider)
router.delete('/:id', validateProviderId, requirePermission('delete', 'providers'), handleDeleteProvider)

export default router
