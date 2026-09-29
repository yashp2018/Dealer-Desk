import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { idParam } from '../../common/validators/common'
import { calendarController } from './calendar.controller'
import {
  calendarQuerySchema,
  createCalendarActivitySchema,
  moveCalendarActivitySchema,
  resizeCalendarActivitySchema,
  updateCalendarActivitySchema,
} from './calendar.validation'

export const calendarRouter = Router()
calendarRouter.use(authenticate)

calendarRouter.get('/', requirePermission('calendar.view_own', 'calendar.view_all'), validate({ query: calendarQuerySchema }), calendarController.list)

calendarRouter.post(
  '/activities',
  requirePermission('calendar.create'),
  validate({ body: createCalendarActivitySchema }),
  calendarController.create,
)
calendarRouter.get(
  '/activities/:id',
  requirePermission('calendar.view_own', 'calendar.view_all'),
  validate({ params: idParam }),
  calendarController.get,
)
calendarRouter.patch(
  '/activities/:id',
  requirePermission('calendar.edit'),
  validate({ params: idParam, body: updateCalendarActivitySchema }),
  calendarController.update,
)
calendarRouter.delete(
  '/activities/:id',
  requirePermission('calendar.delete'),
  validate({ params: idParam }),
  calendarController.remove,
)
calendarRouter.post(
  '/activities/:id/complete',
  requirePermission('calendar.edit'),
  validate({ params: idParam }),
  calendarController.complete,
)
calendarRouter.patch(
  '/activities/:id/move',
  requirePermission('calendar.edit'),
  validate({ params: idParam, body: moveCalendarActivitySchema }),
  calendarController.move,
)
calendarRouter.patch(
  '/activities/:id/resize',
  requirePermission('calendar.edit'),
  validate({ params: idParam, body: resizeCalendarActivitySchema }),
  calendarController.resize,
)
