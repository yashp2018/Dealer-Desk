import { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorizedError } from '../errors/AppError'

export function requirePermission(...anyOf: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.staff) {
      next(new UnauthorizedError())
      return
    }
    const granted = req.staff.permissions
    const hasAccess = granted.includes('*') || anyOf.some((p) => granted.includes(p))
    if (!hasAccess) {
      next(new ForbiddenError(`Missing required permission: ${anyOf.join(' or ')}`))
      return
    }
    next()
  }
}

export function canAccessOwned(req: Request, resourcePrefix: string, ownerStaffId: string | null): boolean {
  if (!req.staff) return false
  const granted = req.staff.permissions
  if (granted.includes('*') || granted.includes(`${resourcePrefix}.view_all`)) return true
  return granted.includes(`${resourcePrefix}.view_own`) && ownerStaffId === req.staff.id
}
