import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, paginated } from '../../common/utils/response'
import { parsePagination } from '../../common/utils/pagination'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { idParam, nestedIdParams } from '../../common/validators/common'
import { prospectService } from './prospect.service'
import { toProspectDto } from './prospect.mapper'
import {
  convertSchema,
  createProspectSchema,
  listProspectsQuery,
  onboardingStatusSchema,
  setStageSchema,
  updateProspectSchema,
} from './prospect.validation'

const prospectController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req)
    const q = req.query
    const { prospects, total } = await prospectService.list({
      skip,
      take: limit,
      q: q.q as string | undefined,
      stage: q.stage as string | undefined,
      ownerStaffId: q.owner_staff_id ? Number(q.owner_staff_id) : undefined,
    })
    paginated(res, prospects, { page, limit, total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const prospect = await prospectService.getOrThrow(Number(req.params.id))
    ok(res, toProspectDto(prospect))
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    created(res, await prospectService.create(req.body, req.staff!.id))
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await prospectService.update(Number(req.params.id), req.body, req.staff!.id))
  }),

  setStage: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await prospectService.setStage(Number(req.params.id), req.body.stage, req.staff!.id))
  }),

  convert: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await prospectService.convert(Number(req.params.id), req.body.tier_id, req.staff!.id))
  }),

  checklist: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await prospectService.checklist(Number(req.params.id)))
  }),

  setOnboardingItem: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await prospectService.setOnboardingItem(Number(req.params.id), Number(req.params.itemId), req.body.status, req.staff!.id))
  }),

  visits: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await prospectService.visits(Number(req.params.id)))
  }),

  requests: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await prospectService.requests(Number(req.params.id)))
  }),
}

export const prospectRouter = Router()
prospectRouter.use(authenticate)

prospectRouter.get('/', requirePermission('prospects.view_own', 'prospects.view_all'), validate({ query: listProspectsQuery }), prospectController.list)
prospectRouter.post('/', requirePermission('prospects.create'), validate({ body: createProspectSchema }), prospectController.create)
prospectRouter.get('/:id', requirePermission('prospects.view_own', 'prospects.view_all'), validate({ params: idParam }), prospectController.get)
prospectRouter.patch('/:id', requirePermission('prospects.edit'), validate({ params: idParam, body: updateProspectSchema }), prospectController.update)
prospectRouter.post('/:id/stage', requirePermission('prospects.edit'), validate({ params: idParam, body: setStageSchema }), prospectController.setStage)
prospectRouter.post('/:id/convert', requirePermission('prospects.convert'), validate({ params: idParam, body: convertSchema }), prospectController.convert)
prospectRouter.get('/:id/checklist', validate({ params: idParam }), prospectController.checklist)
prospectRouter.post(
  '/:id/checklist/:itemId',
  requirePermission('prospects.edit'),
  validate({ params: nestedIdParams, body: onboardingStatusSchema }),
  prospectController.setOnboardingItem,
)
prospectRouter.get('/:id/visits', validate({ params: idParam }), prospectController.visits)
prospectRouter.get('/:id/requests', validate({ params: idParam }), prospectController.requests)
