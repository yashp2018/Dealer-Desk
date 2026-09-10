import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { idParam } from '../../common/validators/common'
import { visitController } from './visit.controller'
import { createVisitSchema, listVisitsQuery, visitOutcomeSchema } from './visit.validation'

export const visitRouter = Router()
visitRouter.use(authenticate)

visitRouter.get('/', requirePermission('visits.view_own', 'visits.view_all'), validate({ query: listVisitsQuery }), visitController.list)
visitRouter.post('/', requirePermission('visits.create'), validate({ body: createVisitSchema }), visitController.create)
visitRouter.get('/:id', requirePermission('visits.view_own', 'visits.view_all'), validate({ params: idParam }), visitController.get)
visitRouter.get('/:id/timeline', validate({ params: idParam }), visitController.timeline)
visitRouter.post('/:id/start', requirePermission('visits.edit'), validate({ params: idParam }), visitController.start)
visitRouter.post('/:id/outcome', requirePermission('visits.edit'), validate({ params: idParam, body: visitOutcomeSchema }), visitController.outcome)
