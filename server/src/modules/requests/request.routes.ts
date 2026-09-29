import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { idParam } from '../../common/validators/common'
import { requestController } from './request.controller'
import {
  assignSchema,
  createRequestSchema,
  detailsSchema,
  handlingSchema,
  listRequestsQuery,
  noteSchema,
  prioritySchema,
  rescheduleSchema,
  reviseSchema,
  setStatusSchema,
} from './request.validation'

// Dealer portal request endpoints live under /portal — see modules/portal.
// This router is staff-only (`authenticate` structurally rejects dealer
// tokens), so nothing here needs its own dealer branch or ownership check.
export const requestRouter = Router()
requestRouter.use(authenticate)

requestRouter.get('/', requirePermission('requests.view_own', 'requests.view_all'), validate({ query: listRequestsQuery }), requestController.list)
requestRouter.post('/', requirePermission('requests.create'), validate({ body: createRequestSchema }), requestController.create)

requestRouter.get('/:id', requirePermission('requests.view_own', 'requests.view_all'), validate({ params: idParam }), requestController.get)
requestRouter.get('/:id/details', requirePermission('requests.view_own', 'requests.view_all'), validate({ params: idParam }), requestController.details)
requestRouter.get('/:id/lines', requirePermission('requests.view_own', 'requests.view_all'), validate({ params: idParam }), requestController.lines)
requestRouter.get('/:id/timeline', requirePermission('requests.view_own', 'requests.view_all'), validate({ params: idParam }), requestController.timeline)
requestRouter.get('/:id/escalations', requirePermission('requests.view_own', 'requests.view_all'), validate({ params: idParam }), requestController.escalations)

requestRouter.post('/:id/status', requirePermission('requests.edit'), validate({ params: idParam, body: setStatusSchema }), requestController.setStatus)
requestRouter.post('/:id/assign', requirePermission('requests.assign'), validate({ params: idParam, body: assignSchema }), requestController.assign)
requestRouter.post('/:id/priority', requirePermission('requests.edit'), validate({ params: idParam, body: prioritySchema }), requestController.setPriority)
requestRouter.post('/:id/reschedule', requirePermission('requests.edit'), validate({ params: idParam, body: rescheduleSchema }), requestController.reschedule)
requestRouter.post('/:id/notes', requirePermission('requests.edit'), validate({ params: idParam, body: noteSchema }), requestController.addNote)
requestRouter.post('/:id/push', requirePermission('requests.push'), validate({ params: idParam }), requestController.push)
requestRouter.post('/:id/revise', requirePermission('requests.edit'), validate({ params: idParam, body: reviseSchema }), requestController.revise)
requestRouter.post('/:id/handling', requirePermission('requests.edit'), validate({ params: idParam, body: handlingSchema }), requestController.saveHandling)
requestRouter.post('/:id/details', requirePermission('requests.edit'), validate({ params: idParam, body: detailsSchema }), requestController.saveDetails)
requestRouter.delete('/:id', requirePermission('requests.delete'), validate({ params: idParam }), requestController.remove)
