import { env } from '../../config/env'
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../../common/errors/AppError'
import { hashPassword, verifyPassword } from '../../common/utils/password'
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiryDate,
  signAccessToken,
} from '../../common/utils/jwt'
import { getStaffPermissions } from '../../common/utils/permissions'
import { authRepository } from './auth.repository'
import { LoginInput } from './auth.validation'
import { DealerUserModel } from '../../models/dealerUser.model'
import { RefreshTokenModel } from '../../models/staff.model'

export interface AuthResult {
  token: string
  expires_in: number
  staff: { id: string; name: string; email: string; role: string; dealerId?: string }
  ref_block: string
  refreshToken: string
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResult> {
    const invalidCredentials = () => new UnauthorizedError('Invalid email or password')

    // Try dealer user first
    const dealerUser = await DealerUserModel.findOne({ email: input.email.toLowerCase() }).lean()
    if (dealerUser) {
      if (dealerUser.lockedUntil && dealerUser.lockedUntil > new Date()) {
        throw new ForbiddenError(`Account temporarily locked. Try again after ${dealerUser.lockedUntil.toISOString()}.`)
      }
      const validPassword = await verifyPassword(input.password, dealerUser.passwordHash)
      if (!validPassword) {
        const failedCount = dealerUser.failedLoginCount + 1
        const shouldLock = failedCount >= env.MAX_FAILED_LOGIN_ATTEMPTS
        await DealerUserModel.findByIdAndUpdate(String(dealerUser._id), {
          $inc: { failedLoginCount: 1 },
          ...(shouldLock ? { lockedUntil: new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60_000) } : {}),
        })
        throw invalidCredentials()
      }
      if (!dealerUser.isActive) throw new ForbiddenError('This account has been deactivated')

      const dealerUserId = String(dealerUser._id)
      const dealerId = String(dealerUser.dealerId)
      await DealerUserModel.findByIdAndUpdate(dealerUserId, { failedLoginCount: 0, lockedUntil: null })

      const { token, expiresIn } = signAccessToken(dealerUserId, [], { role: 'dealer', dealerId })

      const refreshToken = generateRefreshToken()
      await RefreshTokenModel.create({
        staffId: dealerUserId,
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
        staff: { id: dealerUserId, name: dealerUser.name, email: dealerUser.email, role: 'dealer', dealerId },
        ref_block: `REF-${dealerUserId.slice(-4).toUpperCase()}`,
        refreshToken,
      }
    }

    // Fall through to staff login
    const staff = await authRepository.findByEmail(input.email.toLowerCase())
    if (!staff) throw invalidCredentials()

    if (staff.lockedUntil && staff.lockedUntil > new Date()) {
      throw new ForbiddenError(`Account temporarily locked. Try again after ${staff.lockedUntil.toISOString()}.`)
    }

    const validPassword = await verifyPassword(input.password, staff.passwordHash)
    if (!validPassword) {
      const failedCount = staff.failedLoginCount + 1
      const shouldLock = failedCount >= env.MAX_FAILED_LOGIN_ATTEMPTS
      await authRepository.incrementFailedLogins(
        String(staff._id),
        shouldLock ? new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60_000) : null,
      )
      throw invalidCredentials()
    }

    if (!staff.isActive) throw new ForbiddenError('This account has been deactivated')

    const staffId = String(staff._id)
    await authRepository.resetFailedLogins(staffId)

    const permissions = await getStaffPermissions(staffId)
    // Determine role: if staff has '*' permission they are admin
    const role = permissions.includes('*') ? 'admin' : 'staff'
    const { token, expiresIn } = signAccessToken(staffId, permissions, { role })

    const refreshToken = generateRefreshToken()
    await authRepository.createRefreshToken({
      staffId,
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
      staff: { id: staffId, name: staff.name, email: staff.email, role },
      ref_block: `REF-${staffId.slice(-4).toUpperCase()}`,
      refreshToken,
    }
  },

  async refresh(rawRefreshToken: string | undefined): Promise<AuthResult> {
    if (!rawRefreshToken) throw new UnauthorizedError('Missing refresh token')

    const tokenHash = hashRefreshToken(rawRefreshToken)
    const existing = await authRepository.findActiveRefreshTokenByHash(tokenHash)
    if (!existing) throw new UnauthorizedError('Refresh token is invalid or has expired')

    const userId = String(existing.staffId)

    // Check if dealer user
    const dealerUser = await DealerUserModel.findById(userId).lean()
    if (dealerUser) {
      if (!dealerUser.isActive) throw new UnauthorizedError('Account is inactive')
      const dealerId = String(dealerUser.dealerId)
      const newRefreshToken = generateRefreshToken()
      await authRepository.revokeRefreshToken(String(existing._id), hashRefreshToken(newRefreshToken))
      await authRepository.createRefreshToken({
        staffId: userId,
        tokenHash: hashRefreshToken(newRefreshToken),
        deviceId: existing.deviceId,
        platform: existing.platform,
        appVersion: existing.appVersion,
        osVersion: existing.osVersion,
        expiresAt: refreshExpiryDate(),
      })
      const { token, expiresIn } = signAccessToken(userId, [], { role: 'dealer', dealerId })
      return {
        token,
        expires_in: expiresIn,
        staff: { id: userId, name: dealerUser.name, email: dealerUser.email, role: 'dealer', dealerId },
        ref_block: `REF-${userId.slice(-4).toUpperCase()}`,
        refreshToken: newRefreshToken,
      }
    }

    const staff = await authRepository.findById(userId)
    if (!staff || !staff.isActive) throw new UnauthorizedError('Account is inactive')

    const newRefreshToken = generateRefreshToken()
    await authRepository.revokeRefreshToken(String(existing._id), hashRefreshToken(newRefreshToken))
    await authRepository.createRefreshToken({
      staffId: userId,
      tokenHash: hashRefreshToken(newRefreshToken),
      deviceId: existing.deviceId,
      platform: existing.platform,
      appVersion: existing.appVersion,
      osVersion: existing.osVersion,
      expiresAt: refreshExpiryDate(),
    })

    const permissions = await getStaffPermissions(userId)
    const role = permissions.includes('*') ? 'admin' : 'staff'
    const { token, expiresIn } = signAccessToken(userId, permissions, { role })

    return {
      token,
      expires_in: expiresIn,
      staff: { id: userId, name: staff.name, email: staff.email, role },
      ref_block: `REF-${userId.slice(-4).toUpperCase()}`,
      refreshToken: newRefreshToken,
    }
  },

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return
    await authRepository.revokeRefreshTokenByHash(hashRefreshToken(rawRefreshToken))
  },

  async logoutAll(userId: string): Promise<void> {
    await authRepository.revokeAllRefreshTokensForStaff(userId)
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Try dealer user first
    const dealerUser = await DealerUserModel.findById(userId).lean()
    if (dealerUser) {
      const valid = await verifyPassword(currentPassword, dealerUser.passwordHash)
      if (!valid) throw new BadRequestError('Current password is incorrect')
      const newHash = await hashPassword(newPassword)
      await DealerUserModel.findByIdAndUpdate(userId, { passwordHash: newHash })
      await authRepository.revokeAllRefreshTokensForStaff(userId)
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
}
