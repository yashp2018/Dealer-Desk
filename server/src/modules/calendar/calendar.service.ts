import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { calendarRepository } from './calendar.repository'
import { toCalendarActivityDto } from './calendar.mapper'
import { recordTimelineEvent } from '../../common/utils/timeline'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/AppError'
import type { AuthenticatedStaff } from '../../common/middleware/authenticate'
import { CreateCalendarActivityInput, UpdateCalendarActivityInput } from './calendar.validation'

/**
 * Mirrors authorize.ts's canAccessOwned() but works against an actor object
 * directly instead of an Express Request, since the service layer shouldn't
 * depend on the HTTP layer's shape.
 */
function canTouch(actor: AuthenticatedStaff, ownerStaffId: number): boolean {
  if (actor.permissions.includes('*') || actor.permissions.includes('calendar.view_all')) return true
  return actor.permissions.includes('calendar.view_own') && ownerStaffId === actor.id
}

function assertEndAfterStart(start: Date, end: Date) {
  if (end.getTime() <= start.getTime()) {
    throw new BadRequestError('End time must be after start time')
  }
}

async function assertDealerExists(dealerId: number) {
  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } })
  if (!dealer) throw new BadRequestError('Unknown dealer')
}

export const calendarService = {
  async list(params: { startDate: string; endDate: string }, actor: AuthenticatedStaff) {
    const canViewAll = actor.permissions.includes('*') || actor.permissions.includes('calendar.view_all')
    const activities = await calendarRepository.findMany({
      ...params,
      ownerStaffId: canViewAll ? undefined : actor.id,
    })
    return activities.map(toCalendarActivityDto)
  },

  async getOrThrow(id: number) {
    const activity = await calendarRepository.findById(id)
    if (!activity) throw new NotFoundError('Calendar activity')
    return activity
  },

  /** Fetches the raw record and enforces the caller can actually see it — used internally by mutations that need the pre-update values. */
  async getForActor(id: number, actor: AuthenticatedStaff) {
    const activity = await this.getOrThrow(id)
    if (!canTouch(actor, activity.ownerStaffId)) {
      throw new ForbiddenError('You do not have access to this calendar activity')
    }
    return activity
  },

  async getOne(id: number, actor: AuthenticatedStaff) {
    const activity = await this.getForActor(id, actor)
    return toCalendarActivityDto(activity)
  },

  async create(input: CreateCalendarActivityInput, actor: AuthenticatedStaff) {
    if (input.client_uuid) {
      const existing = await calendarRepository.findByClientUuid(input.client_uuid)
      if (existing) return toCalendarActivityDto(existing)
    }

    if (input.dealer_id) await assertDealerExists(input.dealer_id)

    // Only calendar.view_all can hand a new activity straight to someone
    // else — anyone else always ends up owning what they create, regardless
    // of what owner_staff_id they submit.
    const canAssignOthers = actor.permissions.includes('*') || actor.permissions.includes('calendar.view_all')
    const ownerStaffId = canAssignOthers && input.owner_staff_id ? input.owner_staff_id : actor.id

    const created = await calendarRepository.create({
      title: input.title,
      description: input.description,
      type: input.type,
      startAt: new Date(input.start_at),
      endAt: new Date(input.end_at),
      timezone: input.timezone ?? 'Asia/Kolkata',
      reminderMinutes: input.reminder_minutes ?? null,
      dealerId: input.dealer_id ?? null,
      ownerStaffId,
      priority: input.priority ?? 3,
      status: 'scheduled',
      createdBy: actor.id,
      clientUuid: input.client_uuid ?? null,
    })

    await recordTimelineEvent({
      entityType: 'calendar_activity',
      entityId: created.id,
      eventType: 'created',
      summary: `${input.type} "${input.title}" created`,
      actorStaffId: actor.id,
    })

    return toCalendarActivityDto(created)
  },

  async update(id: number, patch: UpdateCalendarActivityInput, actor: AuthenticatedStaff) {
    const activity = await this.getForActor(id, actor)

    const nextStart = patch.start_at ? new Date(patch.start_at) : activity.startAt
    const nextEnd = patch.end_at ? new Date(patch.end_at) : activity.endAt
    assertEndAfterStart(nextStart, nextEnd)

    if (patch.dealer_id) await assertDealerExists(patch.dealer_id)

    const data: Prisma.CalendarActivityUncheckedUpdateInput = { updatedBy: actor.id }
    if (patch.title !== undefined) data.title = patch.title
    if (patch.description !== undefined) data.description = patch.description
    if (patch.type !== undefined) data.type = patch.type
    if (patch.start_at !== undefined) data.startAt = nextStart
    if (patch.end_at !== undefined) data.endAt = nextEnd
    if (patch.reminder_minutes !== undefined) data.reminderMinutes = patch.reminder_minutes
    if (patch.dealer_id !== undefined) data.dealerId = patch.dealer_id
    if (patch.owner_staff_id !== undefined) {
      // Same reassignment guard as create() — only calendar.view_all can
      // hand an activity to someone else, including one the actor already
      // owns themselves.
      const canAssignOthers = actor.permissions.includes('*') || actor.permissions.includes('calendar.view_all')
      data.ownerStaffId = canAssignOthers ? patch.owner_staff_id : actor.id
    }
    if (patch.priority !== undefined) data.priority = patch.priority

    const updated = await calendarRepository.update(id, data)
    await recordTimelineEvent({
      entityType: 'calendar_activity',
      entityId: id,
      eventType: 'updated',
      summary: `Activity "${updated.title}" updated`,
      actorStaffId: actor.id,
    })
    return toCalendarActivityDto(updated)
  },

  async move(id: number, startAt: string, endAt: string, actor: AuthenticatedStaff) {
    const activity = await this.getForActor(id, actor)
    const nextStart = new Date(startAt)
    const nextEnd = new Date(endAt)
    assertEndAfterStart(nextStart, nextEnd)

    const updated = await calendarRepository.update(id, { startAt: nextStart, endAt: nextEnd, updatedBy: actor.id })
    await recordTimelineEvent({
      entityType: 'calendar_activity',
      entityId: id,
      eventType: 'moved',
      summary: `"${activity.title}" moved to ${nextStart.toISOString()}`,
      actorStaffId: actor.id,
    })
    return toCalendarActivityDto(updated)
  },

  async resize(id: number, endAt: string, actor: AuthenticatedStaff) {
    const activity = await this.getForActor(id, actor)
    const nextEnd = new Date(endAt)
    assertEndAfterStart(activity.startAt, nextEnd)

    const updated = await calendarRepository.update(id, { endAt: nextEnd, updatedBy: actor.id })
    await recordTimelineEvent({
      entityType: 'calendar_activity',
      entityId: id,
      eventType: 'resized',
      summary: `"${activity.title}" resized`,
      actorStaffId: actor.id,
    })
    return toCalendarActivityDto(updated)
  },

  async complete(id: number, actor: AuthenticatedStaff) {
    const activity = await this.getForActor(id, actor)
    if (activity.status === 'completed') return toCalendarActivityDto(activity)

    const updated = await calendarRepository.update(id, { status: 'completed', completedAt: new Date(), updatedBy: actor.id })
    await recordTimelineEvent({
      entityType: 'calendar_activity',
      entityId: id,
      eventType: 'completed',
      summary: `"${activity.title}" marked complete`,
      actorStaffId: actor.id,
    })
    return toCalendarActivityDto(updated)
  },

  async remove(id: number, actor: AuthenticatedStaff) {
    await this.getForActor(id, actor)
    await calendarRepository.delete(id)
  },
}
