/**
 * modules/providers/provider.controller.ts
 *
 * HTTP layer only — no business logic.
 */

import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { AppError } from '../../common/errors/AppError'
import { respond } from '../../common/middleware/respond'
import {
  listProviders,
  getProvider,
  createNewProvider,
  updateExistingProvider,
  removeProvider,
  getProviderServices,
} from './provider.service'
import { ProviderListQuery } from './provider.types'

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

export async function handleListProviders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
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
    respond(res, result.items, 'Providers retrieved.', 200, result.meta)
  } catch (err) {
    next(err)
  }
}

export async function handleGetProvider(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const provider = await getProvider(req.params.id)
    respond(res, provider, 'Provider retrieved.')
  } catch (err) {
    next(err)
  }
}

export async function handleCreateProvider(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const provider = await createNewProvider(req.body, req.staff?.id)
    respond(res, provider, 'Provider created.', 201)
  } catch (err) {
    next(err)
  }
}

export async function handleUpdateProvider(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const provider = await updateExistingProvider(
      req.params.id,
      req.body,
      req.staff?.role ?? 'staff',
    )
    respond(res, provider, 'Provider updated.')
  } catch (err) {
    next(err)
  }
}

export async function handleDeleteProvider(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const result = await removeProvider(req.params.id, req.staff?.role ?? 'staff')
    respond(res, result, 'Provider deleted.')
  } catch (err) {
    next(err)
  }
}

export async function handleGetProviderServices(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!assertValid(req, next)) return
    const services = await getProviderServices(req.params.id)
    respond(res, services, 'Provider services retrieved.')
  } catch (err) {
    next(err)
  }
}
