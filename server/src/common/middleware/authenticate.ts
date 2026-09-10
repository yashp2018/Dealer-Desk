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
  dealerId?: number
}

/** Shape embedded in the JWT payload. */
export interface StaffPayload {
  id: number
  email: string
  name: string
  role: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: AuthenticatedStaff
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token')
    }
    const token = header.slice('Bearer '.length).trim()
    const payload = verifyAccessToken(token)
    const userId = Number(payload.sub)
    const role = payload.role ?? 'staff'

    if (role === 'dealer') {
      const dealerUser = await prisma.dealerUser.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, isActive: true, dealerId: true },
      })
      if (!dealerUser || !dealerUser.isActive) {
        throw new UnauthorizedError('Account is inactive or no longer exists')
      }
      req.staff = {
        id: dealerUser.id,
        name: dealerUser.name,
        email: dealerUser.email,
        role: 'dealer',
        permissions: [],
        dealerId: dealerUser.dealerId,
      }
    } else {
      const staff = await prisma.staff.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, isActive: true },
      })
      if (!staff || !staff.isActive) {
        throw new UnauthorizedError('Account is inactive or no longer exists')
      }
      req.staff = {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role,
        permissions: payload.permissions ?? [],
      }
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
