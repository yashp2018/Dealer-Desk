import { Router } from 'express'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { idParam, nestedIdParams } from '../../common/validators/common'
import { handleVisitPhotoUpload } from '../../common/utils/uploads'
import { visitController } from './visit.controller'
import { createVisitSchema, listVisitsQuery, visitAgendaSchema, visitNoteSchema, visitOutcomeSchema } from './visit.validation'

export const visitRouter = Router()
visitRouter.use(authenticate)

visitRouter.get('/', requirePermission('visits.view_own', 'visits.view_all'), validate({ query: listVisitsQuery }), visitController.list)
visitRouter.post('/', requirePermission('visits.create'), validate({ body: createVisitSchema }), visitController.create)
visitRouter.get('/:id', requirePermission('visits.view_own', 'visits.view_all'), validate({ params: idParam }), visitController.get)
visitRouter.get('/:id/timeline', requirePermission('visits.view_own', 'visits.view_all'), validate({ params: idParam }), visitController.timeline)
visitRouter.post('/:id/start', requirePermission('visits.edit'), validate({ params: idParam }), visitController.start)
visitRouter.post('/:id/outcome', requirePermission('visits.edit'), validate({ params: idParam, body: visitOutcomeSchema }), visitController.outcome)
visitRouter.post('/:id/cancel', requirePermission('visits.edit'), validate({ params: idParam }), visitController.cancel)

visitRouter.post('/:id/notes', requirePermission('visits.edit'), validate({ params: idParam, body: visitNoteSchema }), visitController.addNote)

visitRouter.get('/:id/agenda', requirePermission('visits.view_own', 'visits.view_all'), validate({ params: idParam }), visitController.getAgenda)
visitRouter.patch('/:id/agenda', requirePermission('visits.edit'), validate({ params: idParam, body: visitAgendaSchema }), visitController.updateAgenda)

visitRouter.get('/:id/attachments', requirePermission('visits.view_own', 'visits.view_all'), validate({ params: idParam }), visitController.listAttachments)
visitRouter.post('/:id/attachments', requirePermission('visits.edit'), validate({ params: idParam }), handleVisitPhotoUpload, visitController.uploadAttachment)
visitRouter.get('/:id/attachments/:itemId/file', requirePermission('visits.view_own', 'visits.view_all'), validate({ params: nestedIdParams }), visitController.getAttachmentFile)
visitRouter.delete('/:id/attachments/:itemId', requirePermission('visits.edit'), validate({ params: nestedIdParams }), visitController.deleteAttachment)
