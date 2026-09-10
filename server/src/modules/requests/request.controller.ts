import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, paginated } from '../../common/utils/response'
import { parsePagination } from '../../common/utils/pagination'
import { requestService } from './request.service'
import { toRequestDetailsDto, toRequestLineDto, toRequestDto, toTimelineDto, toDealerRequestDto } from './request.mapper'
import { ForbiddenError, NotFoundError } from '../../common/errors/AppError'
import { validate } from '../../common/middleware/validate'
import { dealerCreateRequestSchema } from './request.validation'

export const requestController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    // Dealer cannot access the internal request list
    if (req.staff?.role === 'dealer') {
      throw new ForbiddenError('Access denied')
    }
    const { page, limit, skip } = parsePagination(req)
    const q = req.query
    const { requests, total } = await requestService.list({
      skip,
      take: limit,
      q: q.q as string | undefined,
      status: q.status as string | undefined,
      priority: q.priority ? Number(q.priority) : undefined,
      dealerId: q.dealer_id as string | undefined,
      ownerStaffId: q.owner_staff_id as string | undefined,
      typeId: q.type_id as string | undefined,
      startDate: q.start_date as string | undefined,
      endDate: q.end_date as string | undefined,
    })
    paginated(res, requests, { page, limit, total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const request = await requestService.getOrThrow(req.params.id)
    // Dealer ownership check
    if (req.staff?.role === 'dealer') {
      const dealerId = request.dealerId
        ? String((request.dealerId as { _id?: unknown })._id ?? request.dealerId)
        : null
      if (dealerId !== req.staff.dealerId) throw new NotFoundError('Request')
      ok(res, toDealerRequestDto(request as never))
      return
    }
    ok(res, toRequestDto(request as never))
  }),

  details: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const fields = await requestService.details(req.params.id)
    ok(res, toRequestDetailsDto(req.params.id, fields))
  }),

  lines: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const lines = await requestService.lines(req.params.id)
    ok(res, lines.map(toRequestLineDto))
  }),

  timeline: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const entries = await requestService.timeline(req.params.id)
    ok(res, entries.map(toTimelineDto))
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    // Dealer must use the dealer-specific endpoint
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.create(req.body, req.staff!.id)
    created(res, result)
  }),

  /** POST /requests/dealer — dealer portal request creation */
  createForDealer: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role !== 'dealer') throw new ForbiddenError('Dealer access only')
    const result = await requestService.createForDealer(req.body, req.staff.dealerId!, req.staff.id)
    created(res, result)
  }),

  /** GET /requests/my — dealer portal: own requests */
  myRequests: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role !== 'dealer') throw new ForbiddenError('Dealer access only')
    const { page, limit, skip } = parsePagination(req)
    const { requests, total } = await requestService.list({
      skip,
      take: limit,
      dealerId: req.staff.dealerId!,
    })
    paginated(res, requests.map(toDealerRequestDto as never), { page, limit, total })
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.setStatus(req.params.id, req.body.status, req.staff!.id)
    ok(res, result)
  }),

  assign: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.assign(req.params.id, req.body.staff_id, req.staff!.id)
    ok(res, result)
  }),

  setPriority: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.setPriority(req.params.id, req.body.priority, req.body.reason, req.staff!.id)
    ok(res, result)
  }),

  reschedule: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.reschedule(req.params.id, req.body.due_at, req.staff!.id)
    ok(res, result)
  }),

  addNote: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const entry = await requestService.addNote(req.params.id, req.body.body, req.staff!.id)
    ok(res, entry ? toTimelineDto(entry as never) : null)
  }),

  push: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.push(req.params.id, req.staff!.id)
    ok(res, result)
  }),

  revise: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.revise(req.params.id, req.body.reason, req.staff!.id)
    ok(res, result)
  }),

  saveHandling: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.saveHandling(req.params.id, req.body, req.staff!.id)
    ok(res, result)
  }),

  saveDetails: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff?.role === 'dealer') throw new ForbiddenError('Access denied')
    const result = await requestService.saveDetails(req.params.id, req.body.fields)
    ok(res, result)
  }),
}
