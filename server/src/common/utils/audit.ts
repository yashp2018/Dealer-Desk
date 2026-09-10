import { Request } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'

export async function writeAuditLog(
  req: Request,
  params: {
    action: string
    entityType: string
    entityId?: number
    before?: unknown
    after?: unknown
  },
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorStaffId: req.staff?.id ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      beforeJson: params.before === undefined ? undefined : (params.before as Prisma.InputJsonValue),
      afterJson: params.after === undefined ? undefined : (params.after as Prisma.InputJsonValue),
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req.id as string | undefined) ?? null,
    },
  })
}
