/**
 * modules/services/service.controller.ts
 *
 * HTTP layer only — no business logic.
 */

import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, paginated } from '../../common/utils/response'
import {
  listServices,
  getService,
  createNewService,
  updateExistingService,
  archiveService,
  getServicesByProvider,
} from './service.service'
import { ServiceListQuery } from './service.types'

export const serviceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query: ServiceListQuery = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      provider: req.query.provider ? Number(req.query.provider) : undefined,
      location: req.query.location as string | undefined,
      status: req.query.status as string | undefined,
    }
    const result = await listServices(query)
    paginated(res, result.items, { page: result.meta.page, limit: result.meta.limit, total: result.meta.total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const service = await getService(Number(req.params.id))
    ok(res, service)
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const service = await createNewService(req.body, req.staff?.id)
    created(res, service)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const service = await updateExistingService(Number(req.params.id), req.body, req.staff?.role ?? 'staff')
    ok(res, service)
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await archiveService(Number(req.params.id), req.staff?.role ?? 'staff')
    ok(res, result)
  }),

  byProvider: asyncHandler(async (req: Request, res: Response) => {
    const services = await getServicesByProvider(Number(req.params.providerId))
    ok(res, services)
  }),
}
