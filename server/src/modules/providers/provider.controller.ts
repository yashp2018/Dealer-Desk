/**
 * modules/providers/provider.controller.ts
 *
 * HTTP layer only — no business logic.
 */

import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, paginated } from '../../common/utils/response'
import {
  listProviders,
  getProvider,
  createNewProvider,
  updateExistingProvider,
  removeProvider,
  getProviderServices,
} from './provider.service'
import { ProviderListQuery } from './provider.types'

export const providerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query: ProviderListQuery = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      location: req.query.location as string | undefined,
      status: req.query.status as string | undefined,
      verificationStatus: req.query.verificationStatus as string | undefined,
    }
    const result = await listProviders(query)
    paginated(res, result.items, { page: result.meta.page, limit: result.meta.limit, total: result.meta.total })
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const provider = await getProvider(req.params.id)
    ok(res, provider)
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const provider = await createNewProvider(req.body, req.staff?.id)
    created(res, provider)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const provider = await updateExistingProvider(req.params.id, req.body, req.staff?.role ?? 'staff')
    ok(res, provider)
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await removeProvider(req.params.id, req.staff?.role ?? 'staff')
    ok(res, result)
  }),

  services: asyncHandler(async (req: Request, res: Response) => {
    const services = await getProviderServices(req.params.id)
    ok(res, services)
  }),
}
