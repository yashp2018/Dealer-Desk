import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, noContent, paginated } from '../../common/utils/response'
import { parsePagination } from '../../common/utils/pagination'
import { canAccessOwned } from '../../common/middleware/authorize'
import { BadRequestError, ForbiddenError } from '../../common/errors/AppError'
import { visitService } from './visit.service'
import { toVisitDto } from './visit.mapper'
import { toTimelineDto } from '../requests/request.mapper'

function assertOwnedAccess(req: Request, ownerStaffId: string | null) {
  if (!canAccessOwned(req, 'visits', ownerStaffId)) {
    throw new ForbiddenError('You do not have access to this visit')
  }
}

export const visitController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req)
    const q = req.query
    const { visits, total } = await visitService.list(
      {
        skip,
        take: limit,
        status: q.status as string | undefined,
        dealerId: q.dealer_id as string | undefined,
        ownerStaffId: q.owner_staff_id as string | undefined,
        startDate: q.start_date as string | undefined,
        endDate: q.end_date as string | undefined,
      },
      req.staff!,
    )
    paginated(res, visits, { page, limit, total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const visit = await visitService.getOrThrow(req.params.id)
    assertOwnedAccess(req, visit.ownerStaffId)
    ok(res, toVisitDto(visit))
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await visitService.create(req.body, req.staff!)
    created(res, result)
  }),

  start: asyncHandler(async (req: Request, res: Response) => {
    const result = await visitService.start(req.params.id, req.staff!.id)
    ok(res, result)
  }),

  outcome: asyncHandler(async (req: Request, res: Response) => {
    const result = await visitService.submitOutcome(req.params.id, req.body, req.staff!.id)
    ok(res, result)
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const result = await visitService.cancel(req.params.id, req.staff!.id)
    ok(res, result)
  }),

  timeline: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const visit = await visitService.getOrThrow(id)
    assertOwnedAccess(req, visit.ownerStaffId)
    const entries = await visitService.timeline(id)
    ok(res, entries.map(toTimelineDto))
  }),

  addNote: asyncHandler(async (req: Request, res: Response) => {
    const entry = await visitService.addNote(req.params.id, req.body.body, req.staff!.id)
    created(res, entry ? toTimelineDto(entry) : null)
  }),

  getAgenda: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const visit = await visitService.getOrThrow(id)
    assertOwnedAccess(req, visit.ownerStaffId)
    const items = await visitService.getAgenda(id)
    ok(res, { items })
  }),

  updateAgenda: asyncHandler(async (req: Request, res: Response) => {
    const items = await visitService.updateAgenda(req.params.id, req.body.items, req.staff!.id)
    ok(res, { items })
  }),

  listAttachments: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const visit = await visitService.getOrThrow(id)
    assertOwnedAccess(req, visit.ownerStaffId)
    const attachments = await visitService.listAttachments(id)
    ok(res, attachments)
  }),

  uploadAttachment: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError('No file uploaded')
    const attachment = await visitService.addAttachment(req.params.id, req.file, req.staff!.id)
    created(res, attachment)
  }),

  getAttachmentFile: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const visit = await visitService.getOrThrow(id)
    assertOwnedAccess(req, visit.ownerStaffId)
    const attachment = await visitService.getAttachmentFile(id, req.params.itemId)
    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.fileName)}"`)
    res.sendFile(attachment.filePath)
  }),

  deleteAttachment: asyncHandler(async (req: Request, res: Response) => {
    await visitService.removeAttachment(req.params.id, req.params.itemId, req.staff!.id)
    noContent(res)
  }),
}
