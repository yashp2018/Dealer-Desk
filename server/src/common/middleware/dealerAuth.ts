import { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { UnauthorizedError } from '../errors/AppError'
import { prisma } from '../../config/database'

export interface AuthenticatedDealer {
  id: number // DealerUser id
  dealerId: number // Dealer id — the only value every portal query is scoped by
  name: string
  email: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      dealerAuth?: AuthenticatedDealer
    }
  }
}

/**
 * Dealer-portal-only authentication. Structurally separate from `authenticate`
 * (staff): a staff token's `type` claim can never be 'dealer', so it fails
 * here before reaching any /portal handler. There is no role-branching left
 * to get wrong — a request either carries a valid dealer token and gets a
 * fresh, DB-verified `req.dealerAuth.dealerId`, or it doesn't get in at all.
 *
 * dealerId is re-read from the database on every request (never trusted from
 * the JWT itself) so a deactivated account or a dealer reassignment takes
 * effect immediately, matching how `authenticate` re-checks staff.isActive.
 */
export async function requireDealerAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token')
    }
    const token = header.slice('Bearer '.length).trim()
    const payload = verifyAccessToken(token)

    if (payload.type !== 'dealer') {
      throw new UnauthorizedError('Dealer access only')
    }

    const dealerUserId = Number(payload.sub)
    const dealerUser = await prisma.dealerUser.findUnique({
      where: { id: dealerUserId },
      select: { id: true, name: true, email: true, isActive: true, dealerId: true },
    })
    if (!dealerUser || !dealerUser.isActive) {
      throw new UnauthorizedError('Account is inactive or no longer exists')
    }

    req.dealerAuth = {
      id: dealerUser.id,
      dealerId: dealerUser.dealerId,
      name: dealerUser.name,
      email: dealerUser.email,
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
