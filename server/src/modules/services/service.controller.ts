/**
 * modules/services/service.controller.ts
 *
 * HTTP layer only — no business logic.
 * Responsibilities: parse request, validate, call service, respond.
 */

import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { AppError } from '../../common/errors/AppError'
import { respond } from '../../common/middleware/respond'
import {
  listServices,
  getService,
  createNewService,
  updateExistingService,
  archiveService,
  getServicesByProvider,
} from './service.service'
import { ServiceListQuery } from './service.types'

function assertValid(req: Request, next: NextFunction): boolean {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const mapped: Record<string, string[]> = {}
    for (const e of errors.array()) {
      const field = 'path' in e ? (e.path as string) : 'general'
      mapped[field] = [...(mapped[field] ?? []), e.msg as string]
    }
    next(AppError.badRequest('Validation failed.', mapped))
    return false
  }
  return true
}

export async function handleListServices(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const query: ServiceListQuery = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      provider: req.query.provider as string | undefined,
      location: req.query.location as string | undefined,
      status: req.query.status as string | undefined,
    }
    const result = await listServices(query)
    respond(res, result.items, 'Services retrieved.', 200, result.meta)
  } catch (err) {
    next(err)
  }
}

export async function handleGetService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const service = await getService(req.params.id)
    respond(res, service, 'Service retrieved.')
  } catch (err) {
    next(err)
  }
}

export async function handleCreateService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const service = await createNewService(req.body, req.staff?.id)
    respond(res, service, 'Service created.', 201)
  } catch (err) {
    next(err)
  }
}

export async function handleUpdateService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const service = await updateExistingService(
      req.params.id,
      req.body,
      req.staff?.role ?? 'staff',
    )
    respond(res, service, 'Service updated.')
  } catch (err) {
    next(err)
  }
}

export async function handleDeleteService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const result = await archiveService(req.params.id, req.staff?.role ?? 'staff')
    respond(res, result, 'Service archived.')
  } catch (err) {
    next(err)
  }
}

export async function handleGetServicesByProvider(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const services = await getServicesByProvider(req.params.providerId)
    respond(res, services, 'Provider services retrieved.')
  } catch (err) {
    next(err)
  }
}
