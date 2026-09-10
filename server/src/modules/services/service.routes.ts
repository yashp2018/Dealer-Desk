/**
 * modules/services/service.routes.ts
 */

import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/permissions/permissions.service'
import {
  validateCreateService,
  validateUpdateService,
  validateServiceListQuery,
  validateServiceId,
} from './service.validation'
import {
  handleListServices,
  handleGetService,
  handleCreateService,
  handleUpdateService,
  handleDeleteService,
} from './service.controller'

const router = Router()

router.use(authenticate)

router.get('/', validateServiceListQuery, requirePermission('read', 'services'), handleListServices)
router.get('/:id', validateServiceId, requirePermission('read', 'services'), handleGetService)
router.post('/', validateCreateService, requirePermission('create', 'services'), handleCreateService)
router.patch('/:id', validateUpdateService, requirePermission('update', 'services'), handleUpdateService)
router.delete('/:id', validateServiceId, requirePermission('delete', 'services'), handleDeleteService)

export default router
