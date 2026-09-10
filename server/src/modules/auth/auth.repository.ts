import { StaffModel, RefreshTokenModel } from '../../models/staff.model'

export const authRepository = {
  findByEmail(email: string) {
    return StaffModel.findOne({ email }).lean()
  },

  findById(id: string) {
    return StaffModel.findById(id).lean()
  },

  async incrementFailedLogins(staffId: string, lockedUntil: Date | null) {
    await StaffModel.findByIdAndUpdate(staffId, {
      $inc: { failedLoginCount: 1 },
      ...(lockedUntil ? { lockedUntil } : {}),
    })
  },

  async resetFailedLogins(staffId: string) {
    await StaffModel.findByIdAndUpdate(staffId, { failedLoginCount: 0, lockedUntil: null })
  },

  async updatePassword(staffId: string, passwordHash: string) {
    await StaffModel.findByIdAndUpdate(staffId, { passwordHash })
  },

  createRefreshToken(data: {
    staffId: string
    tokenHash: string
    deviceId: string
    platform: string
    appVersion: string
    osVersion: string
    expiresAt: Date
  }) {
    return RefreshTokenModel.create(data)
  },

  findActiveRefreshTokenByHash(tokenHash: string) {
    return RefreshTokenModel.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean()
  },

  async revokeRefreshToken(id: string, replacedBy?: string) {
    await RefreshTokenModel.findByIdAndUpdate(id, {
      revokedAt: new Date(),
      ...(replacedBy ? { replacedBy } : {}),
    })
  },

  async revokeAllRefreshTokensForStaff(staffId: string) {
    await RefreshTokenModel.updateMany({ staffId, revokedAt: null }, { revokedAt: new Date() })
  },

  async revokeRefreshTokenByHash(tokenHash: string) {
    await RefreshTokenModel.updateMany({ tokenHash, revokedAt: null }, { revokedAt: new Date() })
  },
}
