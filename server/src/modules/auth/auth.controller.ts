import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok } from '../../common/utils/response'
import { authService } from './auth.service'
import { getStaffPermissions } from '../../common/utils/permissions'
import { isProd } from '../../config/env'
import { writeAuditLog } from '../../common/utils/audit'

const REFRESH_COOKIE = 'refresh_token'

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, cookieOptions)
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body)
    setRefreshCookie(res, result.refreshToken)
    await writeAuditLog(req, { action: 'auth.login', entityType: 'staff', entityId: result.staff.id })
    ok(res, {
      token: result.token,
      expires_in: result.expires_in,
      staff: result.staff,
      ref_block: result.ref_block,
    })
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE]
    const result = await authService.refresh(rawToken)
    setRefreshCookie(res, result.refreshToken)
    ok(res, { token: result.token, expires_in: result.expires_in })
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE]
    await authService.logout(rawToken)
    res.clearCookie(REFRESH_COOKIE, cookieOptions)
    ok(res, null, 'Logged out')
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.staff!.id)
    res.clearCookie(REFRESH_COOKIE, cookieOptions)
    ok(res, null, 'Logged out from all devices')
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (req.staff!.role === 'dealer') {
      ok(res, { ...req.staff, permissions: [] })
      return
    }
    const permissions = await getStaffPermissions(req.staff!.id)
    ok(res, { ...req.staff, permissions })
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.staff!.id, req.body.current_password, req.body.new_password)
    ok(res, null, 'Password updated')
  }),
}
