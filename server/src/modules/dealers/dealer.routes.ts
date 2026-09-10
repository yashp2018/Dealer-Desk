import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, paginated, created } from '../../common/utils/response'
import { parsePagination } from '../../common/utils/pagination'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { requireInternal, requireDealerOwnership } from '../../common/middleware/dealerAuth'
import { validate } from '../../common/middleware/validate'
import { dealerService } from './dealer.service'
import { toDealerDto } from './dealer.mapper'
import { addContactSchema, idParam, listDealersQuery, updateDealerSchema } from './dealer.validation'

const dealerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req)
    const q = req.query
    const { dealers, total } = await dealerService.list({
      skip,
      take: limit,
      q: q.q as string | undefined,
      territoryId: q.territory_id as string | undefined,
      tierId: q.tier_id as string | undefined,
      ownerStaffId: q.owner_staff_id as string | undefined,
      health: q.health as string | undefined,
    })
    paginated(res, dealers, { page, limit, total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const dealer = await dealerService.getOrThrow(req.params.id)
    ok(res, toDealerDto(dealer))
  }),

  threeSixty: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.threeSixty(req.params.id))
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const result = await dealerService.update(req.params.id, req.body, req.staff!.id)
    ok(res, result)
  }),

  contacts: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.contacts(req.params.id))
  }),

  addContact: asyncHandler(async (req: Request, res: Response) => {
    const contact = await dealerService.addContact(req.params.id, req.body, req.staff!.id)
    created(res, contact)
  }),

  requests: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.requests(req.params.id))
  }),

  visits: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.visits(req.params.id))
  }),

  timeline: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.timeline(req.params.id))
  }),

  // ── Dealer Portal endpoints ──────────────────────────────────────────────────

  meGet: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.getOwnDealer(req.staff!.dealerId!))
  }),

  meRequests: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.getOwnRequests(req.staff!.dealerId!))
  }),
}

export const dealerRouter = Router()
dealerRouter.use(authenticate)

// ── Dealer Portal routes (dealer role only) ──────────────────────────────────
dealerRouter.get('/me', asyncHandler(async (req: Request, res: Response) => {
  if (req.staff?.role !== 'dealer') { res.status(403).json({ message: 'Forbidden' }); return }
  ok(res, await dealerService.getOwnDealer(req.staff.dealerId!))
}))

dealerRouter.get('/me/requests', asyncHandler(async (req: Request, res: Response) => {
  if (req.staff?.role !== 'dealer') { res.status(403).json({ message: 'Forbidden' }); return }
  ok(res, await dealerService.getOwnRequests(req.staff.dealerId!))
}))

// ── Internal routes (admin/staff only) ──────────────────────────────────────
dealerRouter.get('/', requireInternal, requirePermission('dealers.view_own', 'dealers.view_all'), validate({ query: listDealersQuery }), dealerController.list)
dealerRouter.get('/:id', requireInternal, requirePermission('dealers.view_own', 'dealers.view_all'), validate({ params: idParam }), dealerController.get)
dealerRouter.get('/:id/360', requireInternal, requirePermission('dealers.view_own', 'dealers.view_all'), validate({ params: idParam }), dealerController.threeSixty)
dealerRouter.put('/:id', requireInternal, requirePermission('dealers.edit'), validate({ params: idParam, body: updateDealerSchema }), dealerController.update)
dealerRouter.get('/:id/contacts', requireInternal, validate({ params: idParam }), dealerController.contacts)
dealerRouter.post('/:id/contacts', requireInternal, requirePermission('dealers.edit'), validate({ params: idParam, body: addContactSchema }), dealerController.addContact)
dealerRouter.get('/:id/requests', requireInternal, validate({ params: idParam }), dealerController.requests)
dealerRouter.get('/:id/visits', requireInternal, validate({ params: idParam }), dealerController.visits)
dealerRouter.get('/:id/timeline', requireInternal, validate({ params: idParam }), dealerController.timeline)
