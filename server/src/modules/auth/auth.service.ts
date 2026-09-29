import { OAuth2Client } from 'google-auth-library'
import { env, isProd } from '../../config/env'
import { prisma } from '../../config/database'
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../../common/errors/AppError'
import { hashPassword, verifyPassword } from '../../common/utils/password'
import { generateOtp, hashOtp } from '../../common/utils/otp'
import { sendPasswordResetOtp } from '../../common/utils/mailer'
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiryDate,
  signStaffAccessToken,
  signDealerAccessToken,
} from '../../common/utils/jwt'
import { getStaffPermissions, hasAdminRole } from '../../common/utils/permissions'
import { authRepository } from './auth.repository'
import { LoginInput } from './auth.validation'

const googleClient = new OAuth2Client()

interface DeviceInfo {
  device_id: string
  platform: string
  app_version: string
  os_version: string
}

export interface AuthResult {
  token: string
  expires_in: number
  staff: { id: number; name: string; email: string; role: string; dealerId?: number }
  ref_block: string
  refreshToken: string
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResult> {
    const invalidCredentials = () => new UnauthorizedError('Invalid email or password')
    const email = input.email.toLowerCase()

    // Try dealer user first
    const dealerUser = await prisma.dealerUser.findUnique({ where: { email } })
    if (dealerUser) {
      if (dealerUser.lockedUntil && dealerUser.lockedUntil > new Date()) {
        throw new ForbiddenError(`Account temporarily locked. Try again after ${dealerUser.lockedUntil.toISOString()}.`)
      }
      const validPassword = await verifyPassword(input.password, dealerUser.passwordHash)
      if (!validPassword) {
        const failedCount = dealerUser.failedLoginCount + 1
        const shouldLock = failedCount >= env.MAX_FAILED_LOGIN_ATTEMPTS
        await prisma.dealerUser.update({
          where: { id: dealerUser.id },
          data: {
            failedLoginCount: { increment: 1 },
            ...(shouldLock ? { lockedUntil: new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60_000) } : {}),
          },
        })
        throw invalidCredentials()
      }
      if (!dealerUser.isActive) throw new ForbiddenError('This account has been deactivated')

      await prisma.dealerUser.update({ where: { id: dealerUser.id }, data: { failedLoginCount: 0, lockedUntil: null } })

      const { token, expiresIn } = signDealerAccessToken(dealerUser.id)

      const refreshToken = generateRefreshToken()
      await authRepository.createRefreshToken({
        dealerUserId: dealerUser.id,
        tokenHash: hashRefreshToken(refreshToken),
        deviceId: input.device_id,
        platform: input.platform,
        appVersion: input.app_version,
        osVersion: input.os_version,
        expiresAt: refreshExpiryDate(),
      })

      return {
        token,
        expires_in: expiresIn,
        staff: { id: dealerUser.id, name: dealerUser.name, email: dealerUser.email, role: 'dealer', dealerId: dealerUser.dealerId },
        ref_block: `REF-${String(dealerUser.id).padStart(4, '0')}`,
        refreshToken,
      }
    }

    // Fall through to staff login
    const staff = await authRepository.findByEmail(email)
    if (!staff) throw invalidCredentials()

    if (staff.lockedUntil && staff.lockedUntil > new Date()) {
      throw new ForbiddenError(`Account temporarily locked. Try again after ${staff.lockedUntil.toISOString()}.`)
    }

    const validPassword = await verifyPassword(input.password, staff.passwordHash)
    if (!validPassword) {
      const failedCount = staff.failedLoginCount + 1
      const shouldLock = failedCount >= env.MAX_FAILED_LOGIN_ATTEMPTS
      await authRepository.incrementFailedLogins(
        staff.id,
        shouldLock ? new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60_000) : null,
      )
      throw invalidCredentials()
    }

    if (!staff.isActive) throw new ForbiddenError('This account has been deactivated')

    await authRepository.resetFailedLogins(staff.id)

    const permissions = await getStaffPermissions(staff.id)
    const role = (await hasAdminRole(staff.id)) ? 'admin' : 'staff'
    const { token, expiresIn } = signStaffAccessToken(staff.id, permissions, role)

    const refreshToken = generateRefreshToken()
    await authRepository.createRefreshToken({
      staffId: staff.id,
      tokenHash: hashRefreshToken(refreshToken),
      deviceId: input.device_id,
      platform: input.platform,
      appVersion: input.app_version,
      osVersion: input.os_version,
      expiresAt: refreshExpiryDate(),
    })

    return {
      token,
      expires_in: expiresIn,
      staff: { id: staff.id, name: staff.name, email: staff.email, role },
      ref_block: `REF-${String(staff.id).padStart(4, '0')}`,
      refreshToken,
    }
  },

  async refresh(rawRefreshToken: string | undefined): Promise<AuthResult> {
    if (!rawRefreshToken) throw new UnauthorizedError('Missing refresh token')

    const tokenHash = hashRefreshToken(rawRefreshToken)
    const existing = await authRepository.findActiveRefreshTokenByHash(tokenHash)
    if (!existing) throw new UnauthorizedError('Refresh token is invalid or has expired')

    if (existing.dealerUserId) {
      const dealerUser = await prisma.dealerUser.findUnique({ where: { id: existing.dealerUserId } })
      if (!dealerUser || !dealerUser.isActive) throw new UnauthorizedError('Account is inactive')

      const newRefreshToken = generateRefreshToken()
      await authRepository.revokeRefreshToken(existing.id, hashRefreshToken(newRefreshToken))
      await authRepository.createRefreshToken({
        dealerUserId: dealerUser.id,
        tokenHash: hashRefreshToken(newRefreshToken),
        deviceId: existing.deviceId,
        platform: existing.platform,
        appVersion: existing.appVersion,
        osVersion: existing.osVersion,
        expiresAt: refreshExpiryDate(),
      })
      const { token, expiresIn } = signDealerAccessToken(dealerUser.id)
      return {
        token,
        expires_in: expiresIn,
        staff: { id: dealerUser.id, name: dealerUser.name, email: dealerUser.email, role: 'dealer', dealerId: dealerUser.dealerId },
        ref_block: `REF-${String(dealerUser.id).padStart(4, '0')}`,
        refreshToken: newRefreshToken,
      }
    }

    const staffId = existing.staffId!
    const staff = await authRepository.findById(staffId)
    if (!staff || !staff.isActive) throw new UnauthorizedError('Account is inactive')

    const newRefreshToken = generateRefreshToken()
    await authRepository.revokeRefreshToken(existing.id, hashRefreshToken(newRefreshToken))
    await authRepository.createRefreshToken({
      staffId,
      tokenHash: hashRefreshToken(newRefreshToken),
      deviceId: existing.deviceId,
      platform: existing.platform,
      appVersion: existing.appVersion,
      osVersion: existing.osVersion,
      expiresAt: refreshExpiryDate(),
    })

    const permissions = await getStaffPermissions(staffId)
    const role = (await hasAdminRole(staffId)) ? 'admin' : 'staff'
    const { token, expiresIn } = signStaffAccessToken(staffId, permissions, role)

    return {
      token,
      expires_in: expiresIn,
      staff: { id: staffId, name: staff.name, email: staff.email, role },
      ref_block: `REF-${String(staffId).padStart(4, '0')}`,
      refreshToken: newRefreshToken,
    }
  },

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return
    await authRepository.revokeRefreshTokenByHash(hashRefreshToken(rawRefreshToken))
  },

  async logoutAll(userId: number, role: string): Promise<void> {
    if (role === 'dealer') {
      await authRepository.revokeAllRefreshTokensForDealerUser(userId)
      return
    }
    await authRepository.revokeAllRefreshTokensForStaff(userId)
  },

  async changePassword(userId: number, role: string, currentPassword: string, newPassword: string): Promise<void> {
    if (role === 'dealer') {
      const dealerUser = await prisma.dealerUser.findUnique({ where: { id: userId } })
      if (!dealerUser) throw new UnauthorizedError()
      const valid = await verifyPassword(currentPassword, dealerUser.passwordHash)
      if (!valid) throw new BadRequestError('Current password is incorrect')
      const newHash = await hashPassword(newPassword)
      await prisma.dealerUser.update({ where: { id: userId }, data: { passwordHash: newHash } })
      await authRepository.revokeAllRefreshTokensForDealerUser(userId)
      return
    }

    const staff = await authRepository.findById(userId)
    if (!staff) throw new UnauthorizedError()
    const valid = await verifyPassword(currentPassword, staff.passwordHash)
    if (!valid) throw new BadRequestError('Current password is incorrect')
    const newHash = await hashPassword(newPassword)
    await authRepository.updatePassword(userId, newHash)
    await authRepository.revokeAllRefreshTokensForStaff(userId)
  },

  /**
   * Always resolves the same way whether or not the email is registered —
   * only the (dev-only) returned OTP differs — so this endpoint can never be
   * used to test which emails have an account.
   */
  async requestPasswordReset(email: string): Promise<{ dev_otp?: string }> {
    const normalizedEmail = email.toLowerCase()
    const dealerUser = await prisma.dealerUser.findUnique({ where: { email: normalizedEmail } })
    const staff = dealerUser ? null : await authRepository.findByEmail(normalizedEmail)

    if (!dealerUser && !staff) return {}

    const otp = generateOtp()
    await prisma.passwordResetOtp.create({
      data: {
        email: normalizedEmail,
        otpHash: hashOtp(otp),
        expiresAt: new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60_000),
      },
    })
    await sendPasswordResetOtp(normalizedEmail, otp)

    return env.OTP_DELIVERY === 'console' && !isProd ? { dev_otp: otp } : {}
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const normalizedEmail = email.toLowerCase()
    const record = await prisma.passwordResetOtp.findFirst({
      where: { email: normalizedEmail, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (!record) throw new UnauthorizedError('Code is invalid or has expired. Request a new one.')
    if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedError('Too many incorrect attempts. Request a new code.')
    }
    if (record.otpHash !== hashOtp(otp)) {
      await prisma.passwordResetOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } })
      throw new UnauthorizedError('Incorrect code.')
    }

    await prisma.passwordResetOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } })

    const newHash = await hashPassword(newPassword)

    const dealerUser = await prisma.dealerUser.findUnique({ where: { email: normalizedEmail } })
    if (dealerUser) {
      await prisma.dealerUser.update({
        where: { id: dealerUser.id },
        data: { passwordHash: newHash, failedLoginCount: 0, lockedUntil: null },
      })
      await authRepository.revokeAllRefreshTokensForDealerUser(dealerUser.id)
      return
    }

    const staff = await authRepository.findByEmail(normalizedEmail)
    if (!staff) throw new UnauthorizedError('Account not found.')
    await authRepository.updatePassword(staff.id, newHash)
    await prisma.staff.update({ where: { id: staff.id }, data: { failedLoginCount: 0, lockedUntil: null } })
    await authRepository.revokeAllRefreshTokensForStaff(staff.id)
  },

  /** "Sign in with Google" — bypasses password entirely for an existing account whose email matches a verified Google identity. Does not create new accounts. */
  async googleLogin(idToken: string, device: DeviceInfo): Promise<AuthResult> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new BadRequestError('Google Sign-In is not configured on this server yet.')
    }

    let email: string | undefined
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })
      const payload = ticket.getPayload()
      if (payload?.email_verified) email = payload.email
    } catch {
      throw new UnauthorizedError('Invalid Google credential')
    }
    if (!email) throw new UnauthorizedError('Google account email is not verified')
    email = email.toLowerCase()

    const dealerUser = await prisma.dealerUser.findUnique({ where: { email } })
    if (dealerUser) {
      if (!dealerUser.isActive) throw new ForbiddenError('This account has been deactivated')
      const { token, expiresIn } = signDealerAccessToken(dealerUser.id)
      const refreshToken = generateRefreshToken()
      await authRepository.createRefreshToken({
        dealerUserId: dealerUser.id,
        tokenHash: hashRefreshToken(refreshToken),
        deviceId: device.device_id,
        platform: device.platform,
        appVersion: device.app_version,
        osVersion: device.os_version,
        expiresAt: refreshExpiryDate(),
      })
      return {
        token,
        expires_in: expiresIn,
        staff: { id: dealerUser.id, name: dealerUser.name, email: dealerUser.email, role: 'dealer', dealerId: dealerUser.dealerId },
        ref_block: `REF-${String(dealerUser.id).padStart(4, '0')}`,
        refreshToken,
      }
    }

    const staff = await authRepository.findByEmail(email)
    if (!staff) throw new UnauthorizedError('No Dealer Desk account found for this Google email.')
    if (!staff.isActive) throw new ForbiddenError('This account has been deactivated')

    const permissions = await getStaffPermissions(staff.id)
    const role = (await hasAdminRole(staff.id)) ? 'admin' : 'staff'
    const { token, expiresIn } = signStaffAccessToken(staff.id, permissions, role)
    const refreshToken = generateRefreshToken()
    await authRepository.createRefreshToken({
      staffId: staff.id,
      tokenHash: hashRefreshToken(refreshToken),
      deviceId: device.device_id,
      platform: device.platform,
      appVersion: device.app_version,
      osVersion: device.os_version,
      expiresAt: refreshExpiryDate(),
    })

    return {
      token,
      expires_in: expiresIn,
      staff: { id: staff.id, name: staff.name, email: staff.email, role },
      ref_block: `REF-${String(staff.id).padStart(4, '0')}`,
      refreshToken,
    }
  },
}
