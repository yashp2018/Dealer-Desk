import { prisma } from '../../config/database'

export const authRepository = {
  findByEmail(email: string) {
    return prisma.staff.findUnique({ where: { email } })
  },

  findById(id: string) {
    return prisma.staff.findUnique({ where: { id } })
  },

  async incrementFailedLogins(staffId: string, lockedUntil: Date | null) {
    await prisma.staff.update({
      where: { id: staffId },
      data: { failedLoginCount: { increment: 1 }, ...(lockedUntil ? { lockedUntil } : {}) },
    })
  },

  async resetFailedLogins(staffId: string) {
    await prisma.staff.update({ where: { id: staffId }, data: { failedLoginCount: 0, lockedUntil: null } })
  },

  async updatePassword(staffId: string, passwordHash: string) {
    await prisma.staff.update({ where: { id: staffId }, data: { passwordHash } })
  },

  createRefreshToken(data: {
    staffId?: string
    dealerUserId?: string
    tokenHash: string
    deviceId: string
    platform: string
    appVersion: string
    osVersion: string
    expiresAt: Date
  }) {
    return prisma.refreshToken.create({ data })
  },

  findActiveRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    })
  },

  async revokeRefreshToken(id: string, replacedBy?: string) {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), ...(replacedBy ? { replacedBy } : {}) },
    })
  },

  async revokeAllRefreshTokensForStaff(staffId: string) {
    await prisma.refreshToken.updateMany({ where: { staffId, revokedAt: null }, data: { revokedAt: new Date() } })
  },

  async revokeAllRefreshTokensForDealerUser(dealerUserId: string) {
    await prisma.refreshToken.updateMany({ where: { dealerUserId, revokedAt: null }, data: { revokedAt: new Date() } })
  },

  async revokeRefreshTokenByHash(tokenHash: string) {
    await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } })
  },
}
