import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'

type TxClient = Prisma.TransactionClient

export type TimelineEntityType = 'dealer' | 'prospect' | 'request' | 'visit' | 'calendar_activity'

export async function recordTimelineEvent(
  params: {
    entityType: TimelineEntityType
    entityId: number
    eventType: string
    summary: string
    actorStaffId: number | null
  },
  tx?: TxClient,
): Promise<void> {
  const client = tx ?? prisma
  await client.timelineEntry.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      eventType: params.eventType,
      summary: params.summary,
      actorStaffId: params.actorStaffId ?? null,
    },
  })
}
