import { Request } from 'express'
import { AuditLogModel } from '../../models/audit.model'

export async function writeAuditLog(
  req: Request,
  params: {
    action: string
    entityType: string
    entityId?: string
    before?: unknown
    after?: unknown
  },
): Promise<void> {
  await AuditLogModel.create({
    actorStaffId: req.staff?.id ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    beforeJson: params.before ?? null,
    afterJson: params.after ?? null,
    ip: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
    requestId: (req.id as string | undefined) ?? null,
  })
}
