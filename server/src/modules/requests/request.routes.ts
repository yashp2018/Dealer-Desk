import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { requireDealer } from '../../common/middleware/dealerAuth'
import { validate } from '../../common/middleware/validate'
import { idParam } from '../../common/validators/common'
import { requestController } from './request.controller'
import {
  assignSchema,
  createRequestSchema,
  dealerCreateRequestSchema,
  detailsSchema,
  handlingSchema,
  listRequestsQuery,
  noteSchema,
  prioritySchema,
  rescheduleSchema,
  reviseSchema,
  setStatusSchema,
} from './request.validation'

export const requestRouter = Router()
requestRouter.use(authenticate)

// ── Dealer portal endpoints (dealer role only) ────────────────────────────────
requestRouter.get('/my', requireDealer, requestController.myRequests)
requestRouter.post('/dealer', requireDealer, validate({ body: dealerCreateRequestSchema }), requestController.createForDealer)

// ── Internal endpoints (admin/staff only, dealer blocked in controller) ───────
requestRouter.get('/', requirePermission('requests.view_own', 'requests.view_all'), validate({ query: listRequestsQuery }), requestController.list)
requestRouter.post('/', requirePermission('requests.create'), validate({ body: createRequestSchema }), requestController.create)

requestRouter.get('/:id', validate({ params: idParam }), requestController.get)
requestRouter.get('/:id/details', validate({ params: idParam }), requestController.details)
requestRouter.get('/:id/lines', validate({ params: idParam }), requestController.lines)
requestRouter.get('/:id/timeline', validate({ params: idParam }), requestController.timeline)

requestRouter.post('/:id/status', requirePermission('requests.edit'), validate({ params: idParam, body: setStatusSchema }), requestController.setStatus)
requestRouter.post('/:id/assign', requirePermission('requests.assign'), validate({ params: idParam, body: assignSchema }), requestController.assign)
requestRouter.post('/:id/priority', requirePermission('requests.edit'), validate({ params: idParam, body: prioritySchema }), requestController.setPriority)
requestRouter.post('/:id/reschedule', requirePermission('requests.edit'), validate({ params: idParam, body: rescheduleSchema }), requestController.reschedule)
requestRouter.post('/:id/notes', requirePermission('requests.edit'), validate({ params: idParam, body: noteSchema }), requestController.addNote)
requestRouter.post('/:id/push', requirePermission('requests.push'), validate({ params: idParam }), requestController.push)
requestRouter.post('/:id/revise', requirePermission('requests.edit'), validate({ params: idParam, body: reviseSchema }), requestController.revise)
requestRouter.post('/:id/handling', requirePermission('requests.edit'), validate({ params: idParam, body: handlingSchema }), requestController.saveHandling)
requestRouter.post('/:id/details', requirePermission('requests.edit'), validate({ params: idParam, body: detailsSchema }), requestController.saveDetails)
