import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, paginated, noContent } from '../../common/utils/response'
import { parsePagination } from '../../common/utils/pagination'
import { canAccessOwned } from '../../common/middleware/authorize'
import { ForbiddenError } from '../../common/errors/AppError'
import { requestService } from './request.service'
import { toRequestDetailsDto, toRequestLineDto, toRequestDto, toTimelineDto, toEscalationLogDto } from './request.mapper'

function assertOwnedAccess(req: Request, ownerStaffId: string | null) {
  if (!canAccessOwned(req, 'requests', ownerStaffId)) {
    throw new ForbiddenError('You do not have access to this request')
  }
}

export const requestController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req)
    const q = req.query
    const { requests, total } = await requestService.list(
      {
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
      },
      req.staff!,
    )
    paginated(res, requests, { page, limit, total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const request = await requestService.getOrThrow(req.params.id)
    assertOwnedAccess(req, request.ownerStaffId)
    ok(res, toRequestDto(request))
  }),

  details: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const request = await requestService.getOrThrow(id)
    assertOwnedAccess(req, request.ownerStaffId)
    const fields = await requestService.details(id)
    ok(res, toRequestDetailsDto(id, fields))
  }),

  lines: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const request = await requestService.getOrThrow(id)
    assertOwnedAccess(req, request.ownerStaffId)
    const lines = await requestService.lines(id)
    ok(res, lines.map(toRequestLineDto))
  }),

  timeline: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const request = await requestService.getOrThrow(id)
    assertOwnedAccess(req, request.ownerStaffId)
    const entries = await requestService.timeline(id)
    ok(res, entries.map(toTimelineDto))
  }),

  escalations: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const request = await requestService.getOrThrow(id)
    assertOwnedAccess(req, request.ownerStaffId)
    const logs = await requestService.escalations(id)
    ok(res, logs.map(toEscalationLogDto))
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.create(req.body, req.staff!)
    created(res, result)
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.setStatus(req.params.id, req.body.status, req.staff!.id)
    ok(res, result)
  }),

  assign: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.assign(req.params.id, req.body.staff_id, req.staff!.id)
    ok(res, result)
  }),

  setPriority: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.setPriority(req.params.id, req.body.priority, req.body.reason, req.staff!.id)
    ok(res, result)
  }),

  reschedule: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.reschedule(req.params.id, req.body.due_at, req.staff!.id)
    ok(res, result)
  }),

  addNote: asyncHandler(async (req: Request, res: Response) => {
    const entry = await requestService.addNote(req.params.id, req.body.body, req.staff!.id)
    ok(res, entry ? toTimelineDto(entry) : null)
  }),

  push: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.push(req.params.id, req.staff!.id)
    ok(res, result)
  }),

  revise: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.revise(req.params.id, req.body.reason, req.staff!.id)
    ok(res, result)
  }),

  saveHandling: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.saveHandling(req.params.id, req.body, req.staff!.id)
    ok(res, result)
  }),

  saveDetails: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.saveDetails(req.params.id, req.body.fields)
    ok(res, result)
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await requestService.remove(req.params.id, req.staff!.id)
    noContent(res)
  }),
}
