import { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorizedError } from '../errors/AppError'

/** Allow only dealer role. */
export function requireDealer(req: Request, _res: Response, next: NextFunction): void {
  if (!req.staff) { next(new UnauthorizedError()); return }
  if (req.staff.role !== 'dealer') { next(new ForbiddenError('Dealer access only')); return }
  next()
}

/** Allow only admin or staff (not dealer). */
export function requireInternal(req: Request, _res: Response, next: NextFunction): void {
  if (!req.staff) { next(new UnauthorizedError()); return }
  if (req.staff.role === 'dealer') { next(new ForbiddenError('Internal access only')); return }
  next()
}

/**
 * Ensures the authenticated dealer owns the resource identified by dealerId.
 * Admin bypasses this check. Staff uses normal permission checks (not this middleware).
 */
export function requireDealerOwnership(getDealerId: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.staff) { next(new UnauthorizedError()); return }
    if (req.staff.role === 'admin') { next(); return }
    if (req.staff.role === 'dealer') {
      const resourceDealerId = getDealerId(req)
      if (!resourceDealerId || resourceDealerId !== req.staff.dealerId) {
        next(new ForbiddenError())
        return
      }
      next()
      return
    }
    // staff — let normal permission middleware handle it
    next()
  }
}
