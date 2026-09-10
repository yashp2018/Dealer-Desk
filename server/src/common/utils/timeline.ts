import { TimelineEntryModel } from '../../models/timeline.model'

export type TimelineEntityType = 'dealer' | 'prospect' | 'request' | 'visit'

export async function recordTimelineEvent(params: {
  entityType: TimelineEntityType
  entityId: string
  eventType: string
  summary: string
  actorStaffId: string | null
}): Promise<void> {
  await TimelineEntryModel.create({
    entityType: params.entityType,
    entityId: params.entityId,
    eventType: params.eventType,
    summary: params.summary,
    actorStaffId: params.actorStaffId ?? null,
  })
}
