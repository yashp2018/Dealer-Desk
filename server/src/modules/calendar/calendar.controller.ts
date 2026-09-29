import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, noContent } from '../../common/utils/response'
import { calendarService } from './calendar.service'

export const calendarController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const activities = await calendarService.list({
      startDate: req.query.start_date as string,
      endDate: req.query.end_date as string,
    }, req.staff!)
    ok(res, activities)
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const activity = await calendarService.getOne(Number(req.params.id), req.staff!)
    ok(res, activity)
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const activity = await calendarService.create(req.body, req.staff!)
    created(res, activity)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const activity = await calendarService.update(Number(req.params.id), req.body, req.staff!)
    ok(res, activity)
  }),

  move: asyncHandler(async (req: Request, res: Response) => {
    const activity = await calendarService.move(Number(req.params.id), req.body.start_at, req.body.end_at, req.staff!)
    ok(res, activity)
  }),

  resize: asyncHandler(async (req: Request, res: Response) => {
    const activity = await calendarService.resize(Number(req.params.id), req.body.end_at, req.staff!)
    ok(res, activity)
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const activity = await calendarService.complete(Number(req.params.id), req.staff!)
    ok(res, activity)
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await calendarService.remove(Number(req.params.id), req.staff!)
    noContent(res)
  }),
}
