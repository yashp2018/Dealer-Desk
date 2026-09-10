import { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { UnauthorizedError } from '../errors/AppError'
import { StaffModel } from '../../models/staff.model'
import { DealerUserModel } from '../../models/dealerUser.model'

export interface AuthenticatedStaff {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  dealerId?: string
}

/** Shape embedded in the JWT payload (also used by auth.ts legacy router). */
export interface StaffPayload {
  id: string
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

    const role: string = (payload as unknown as Record<string, string>).role ?? 'staff'

    if (role === 'dealer') {
      const dealerUser = await DealerUserModel.findById(payload.sub).select('name email isActive dealerId').lean()
      if (!dealerUser || !dealerUser.isActive) {
        throw new UnauthorizedError('Account is inactive or no longer exists')
      }
      req.staff = {
        id: String(dealerUser._id),
        name: dealerUser.name,
        email: dealerUser.email,
        role: 'dealer',
        permissions: [],
        dealerId: String(dealerUser.dealerId),
      }
    } else {
      const staff = await StaffModel.findById(payload.sub).select('name email isActive').lean()
      if (!staff || !staff.isActive) {
        throw new UnauthorizedError('Account is inactive or no longer exists')
      }
      req.staff = {
        id: String(staff._id),
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
