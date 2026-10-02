import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, paginated, created } from '../../common/utils/response'
import { parsePagination } from '../../common/utils/pagination'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission, canAccessOwned } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { ForbiddenError, BadRequestError } from '../../common/errors/AppError'
import { handleDealerImportUpload } from '../../common/utils/uploads'
import { dealerService } from './dealer.service'
import { toDealerDto } from './dealer.mapper'
import {
  addContactSchema,
  createDealerSchema,
  idParam,
  listDealersQuery,
  listImportCandidatesQuery,
  updateDealerSchema,
} from './dealer.validation'

function assertOwnedAccess(req: Request, ownerStaffId: string | null) {
  if (!canAccessOwned(req, 'dealers', ownerStaffId)) {
    throw new ForbiddenError('You do not have access to this dealer')
  }
}

// Dealer-portal "my own profile/requests" endpoints live under /portal — see
// modules/portal. This router is staff-only (`authenticate` structurally
// rejects dealer tokens).
const dealerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req)
    const q = req.query
    const { dealers, total } = await dealerService.list(
      {
        skip,
        take: limit,
        q: q.q as string | undefined,
        territoryId: q.territory_id as string | undefined,
        tierId: q.tier_id as string | undefined,
        ownerStaffId: q.owner_staff_id as string | undefined,
        health: q.health as string | undefined,
      },
      req.staff!,
    )
    paginated(res, dealers, { page, limit, total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const dealer = await dealerService.getOrThrow(req.params.id)
    assertOwnedAccess(req, dealer.ownerStaffId)
    ok(res, toDealerDto(dealer))
  }),

  threeSixty: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const dealer = await dealerService.getOrThrow(id)
    assertOwnedAccess(req, dealer.ownerStaffId)
    ok(res, await dealerService.threeSixty(id))
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await dealerService.create(req.body, req.staff!)
    created(res, result)
  }),

  importCandidates: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError('No file uploaded')
    const result = await dealerService.importCandidates(req.file, req.staff!.id)
    ok(res, result)
  }),

  listImportCandidates: asyncHandler(async (req: Request, res: Response) => {
    const candidates = await dealerService.listImportCandidates(req.query.q as string | undefined)
    ok(res, candidates)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const result = await dealerService.update(req.params.id, req.body, req.staff!.id)
    ok(res, result)
  }),

  contacts: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const dealer = await dealerService.getOrThrow(id)
    assertOwnedAccess(req, dealer.ownerStaffId)
    ok(res, await dealerService.contacts(id))
  }),

  addContact: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const dealer = await dealerService.getOrThrow(id)
    assertOwnedAccess(req, dealer.ownerStaffId)
    const contact = await dealerService.addContact(id, req.body, req.staff!.id)
    created(res, contact)
  }),

  requests: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const dealer = await dealerService.getOrThrow(id)
    assertOwnedAccess(req, dealer.ownerStaffId)
    ok(res, await dealerService.requests(id))
  }),

  visits: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const dealer = await dealerService.getOrThrow(id)
    assertOwnedAccess(req, dealer.ownerStaffId)
    ok(res, await dealerService.visits(id))
  }),

  timeline: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const dealer = await dealerService.getOrThrow(id)
    assertOwnedAccess(req, dealer.ownerStaffId)
    ok(res, await dealerService.timeline(id))
  }),
}

export const dealerRouter = Router()
dealerRouter.use(authenticate)

dealerRouter.get('/', requirePermission('dealers.view_own', 'dealers.view_all'), validate({ query: listDealersQuery }), dealerController.list)
dealerRouter.post('/', requirePermission('dealers.create'), validate({ body: createDealerSchema }), dealerController.create)
dealerRouter.post('/import', requirePermission('dealers.create'), handleDealerImportUpload, dealerController.importCandidates)
dealerRouter.get('/import/candidates', requirePermission('dealers.create'), validate({ query: listImportCandidatesQuery }), dealerController.listImportCandidates)
dealerRouter.get('/:id', requirePermission('dealers.view_own', 'dealers.view_all'), validate({ params: idParam }), dealerController.get)
dealerRouter.get('/:id/360', requirePermission('dealers.view_own', 'dealers.view_all'), validate({ params: idParam }), dealerController.threeSixty)
dealerRouter.put('/:id', requirePermission('dealers.edit'), validate({ params: idParam, body: updateDealerSchema }), dealerController.update)
dealerRouter.get('/:id/contacts', requirePermission('dealers.view_own', 'dealers.view_all'), validate({ params: idParam }), dealerController.contacts)
dealerRouter.post('/:id/contacts', requirePermission('dealers.edit'), validate({ params: idParam, body: addContactSchema }), dealerController.addContact)
dealerRouter.get('/:id/requests', requirePermission('dealers.view_own', 'dealers.view_all'), validate({ params: idParam }), dealerController.requests)
dealerRouter.get('/:id/visits', requirePermission('dealers.view_own', 'dealers.view_all'), validate({ params: idParam }), dealerController.visits)
dealerRouter.get('/:id/timeline', requirePermission('dealers.view_own', 'dealers.view_all'), validate({ params: idParam }), dealerController.timeline)
