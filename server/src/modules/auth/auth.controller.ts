import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok } from '../../common/utils/response'
import { authService, AuthResult } from './auth.service'
import { getStaffPermissions } from '../../common/utils/permissions'
import { isProd } from '../../config/env'
import { writeAuditLog } from '../../common/utils/audit'
import { generateCsrfToken } from '../../common/utils/csrf'
import { CSRF_COOKIE } from '../../common/middleware/csrf'

const REFRESH_COOKIE = 'refresh_token'

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
}

// Deliberately NOT httpOnly — the frontend reads this via document.cookie
// and echoes it back as X-CSRF-Token on every request (see src/api/client.ts).
// path is '/' (unlike the refresh cookie) so it's visible from every page,
// not just requests under /api/v1/auth.
const csrfCookieOptions = {
  httpOnly: false,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, cookieOptions)
}

function setCsrfCookie(res: Response): string {
  const csrfToken = generateCsrfToken()
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions)
  return csrfToken
}

/** Shared by every flow that ends in "issue a fresh session" (password login, Google login). */
function sendAuthResult(res: Response, result: AuthResult): void {
  setRefreshCookie(res, result.refreshToken)
  const csrfToken = setCsrfCookie(res)
  ok(res, {
    token: result.token,
    expires_in: result.expires_in,
    staff: result.staff,
    ref_block: result.ref_block,
    csrf_token: csrfToken,
  })
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body)
    await writeAuditLog(req, { action: 'auth.login', entityType: 'staff', entityId: result.staff.id })
    sendAuthResult(res, result)
  }),

  google: asyncHandler(async (req: Request, res: Response) => {
    const { credential, device_id, platform, app_version, os_version } = req.body
    const result = await authService.googleLogin(credential, { device_id, platform, app_version, os_version })
    await writeAuditLog(req, { action: 'auth.login.google', entityType: 'staff', entityId: result.staff.id })
    sendAuthResult(res, result)
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestPasswordReset(req.body.email)
    ok(res, result, 'If that email is registered, a verification code has been sent.')
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.email, req.body.otp, req.body.new_password)
    ok(res, null, 'Password reset — you can now log in with your new password.')
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE]
    const result = await authService.refresh(rawToken)
    setRefreshCookie(res, result.refreshToken)
    const csrfToken = setCsrfCookie(res)
    ok(res, { token: result.token, expires_in: result.expires_in, csrf_token: csrfToken })
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE]
    await authService.logout(rawToken)
    res.clearCookie(REFRESH_COOKIE, cookieOptions)
    res.clearCookie(CSRF_COOKIE, csrfCookieOptions)
    ok(res, null, 'Logged out')
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.staff!.id, req.staff!.role)
    res.clearCookie(REFRESH_COOKIE, cookieOptions)
    res.clearCookie(CSRF_COOKIE, csrfCookieOptions)
    ok(res, null, 'Logged out from all devices')
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const permissions = await getStaffPermissions(req.staff!.id)
    ok(res, { ...req.staff, permissions })
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.staff!.id, req.staff!.role, req.body.current_password, req.body.new_password)
    ok(res, null, 'Password updated')
  }),
}
