import { NextFunction, Request, Response } from 'express'
import { ForbiddenError } from '../errors/AppError'

export const CSRF_COOKIE = 'csrf_token'
export const CSRF_HEADER = 'x-csrf-token'

/**
 * Double-submit CSRF check. Apply this ONLY to routes that are reachable
 * using nothing but the ambient refresh-token cookie (currently just
 * /auth/refresh and /auth/logout — see the audit note in auth.routes.ts).
 * Every other route in this app requires a Bearer access token, which a
 * cross-site request cannot forge, so CSRF protection is redundant there.
 */
export function requireCsrfToken(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const rawHeader = req.headers[CSRF_HEADER]
  const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new ForbiddenError('Missing or invalid CSRF token'))
    return
  }
  next()
}
