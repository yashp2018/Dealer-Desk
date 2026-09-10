import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, paginated } from '../../common/utils/response'
import { parsePagination } from '../../common/utils/pagination'
import { visitService } from './visit.service'
import { toVisitDto } from './visit.mapper'
import { toTimelineDto } from '../requests/request.mapper'

export const visitController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req)
    const q = req.query
    const { visits, total } = await visitService.list({
      skip,
      take: limit,
      status: q.status as string | undefined,
      dealerId: q.dealer_id ? Number(q.dealer_id) : undefined,
      ownerStaffId: q.owner_staff_id ? Number(q.owner_staff_id) : undefined,
      startDate: q.start_date as string | undefined,
      endDate: q.end_date as string | undefined,
    })
    paginated(res, visits, { page, limit, total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const visit = await visitService.getOrThrow(Number(req.params.id))
    ok(res, toVisitDto(visit))
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await visitService.create(req.body, req.staff!.id)
    created(res, result)
  }),

  start: asyncHandler(async (req: Request, res: Response) => {
    const result = await visitService.start(Number(req.params.id), req.staff!.id)
    ok(res, result)
  }),

  outcome: asyncHandler(async (req: Request, res: Response) => {
    const result = await visitService.submitOutcome(Number(req.params.id), req.body, req.staff!.id)
    ok(res, result)
  }),

  timeline: asyncHandler(async (req: Request, res: Response) => {
    const entries = await visitService.timeline(Number(req.params.id))
    ok(res, entries.map(toTimelineDto))
  }),
}
