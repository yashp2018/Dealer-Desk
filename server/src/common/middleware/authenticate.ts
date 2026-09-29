import { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { UnauthorizedError } from '../errors/AppError'
import { prisma } from '../../config/database'

export interface AuthenticatedStaff {
  id: number
  name: string
  email: string
  role: string
  permissions: string[]
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: AuthenticatedStaff
    }
  }
}

/**
 * Staff-only authentication. Structurally rejects any dealer-portal token —
 * a dealer token's `type` claim can never be 'staff', so it fails here
 * before any route handler or permission check ever runs. This is the
 * single choke point that keeps every internal route (bootstrap, dashboard,
 * search, setup, sync, dealers/prospects/requests/visits lists, etc.)
 * unreachable to a dealer login, without each route having to remember to
 * check the caller's type itself.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token')
    }
    const token = header.slice('Bearer '.length).trim()
    const payload = verifyAccessToken(token)

    if (payload.type !== 'staff') {
      throw new UnauthorizedError('Staff access only')
    }

    const staffId = Number(payload.sub)
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, name: true, email: true, isActive: true },
    })
    if (!staff || !staff.isActive) {
      throw new UnauthorizedError('Account is inactive or no longer exists')
    }

    req.staff = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: payload.role,
      permissions: payload.permissions ?? [],
    }

    next()
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err)
      return
    }
    next(new UnauthorizedError('Invalid or expired token'))
  }
}
