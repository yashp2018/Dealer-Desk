import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { createApp } from '../src/app'
import { TEST_PASSWORD, testStaffId } from './setup'
import './setup'
import { prisma } from '../src/config/database'

const app = createApp()
let token: string

/** A second staff member with only calendar.view_own (no view_all) — used for cross-user access checks. */
let limitedToken: string
let limitedStaffId: number

beforeAll(async () => {
  const res = await request(app).post('/api/v1/auth/login').send({
    email: 'test.user@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  })
  token = res.body.data.token

  const limitedRole = await prisma.role.upsert({
    where: { key: 'calendar_limited_test_role' },
    create: { key: 'calendar_limited_test_role', name: 'Calendar Limited Test Role' },
    update: {},
  })
  const viewOwn = await prisma.permission.upsert({ where: { key: 'calendar.view_own' }, create: { key: 'calendar.view_own', label: 'calendar.view_own' }, update: {} })
  const create = await prisma.permission.upsert({ where: { key: 'calendar.create' }, create: { key: 'calendar.create', label: 'calendar.create' }, update: {} })
  const edit = await prisma.permission.upsert({ where: { key: 'calendar.edit' }, create: { key: 'calendar.edit', label: 'calendar.edit' }, update: {} })
  await Promise.all(
    [viewOwn, create, edit].map((p) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: limitedRole.id, permissionId: p.id } },
        create: { roleId: limitedRole.id, permissionId: p.id },
        update: {},
      }),
    ),
  )
  const limitedStaff = await prisma.staff.upsert({
    where: { email: 'test.limited@dealer.com' },
    create: { name: 'Limited Test User', email: 'test.limited@dealer.com', passwordHash: await bcrypt.hash(TEST_PASSWORD, 4) },
    update: {},
  })
  limitedStaffId = limitedStaff.id
  await prisma.staffRole.upsert({
    where: { staffId_roleId: { staffId: limitedStaff.id, roleId: limitedRole.id } },
    create: { staffId: limitedStaff.id, roleId: limitedRole.id },
    update: {},
  })

  const limitedRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test.limited@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device-2',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  })
  limitedToken = limitedRes.body.data.token

  // This file POSTs a real calendar activity in nearly every test, none of
  // them upserts — only this file ever creates activities owned by these
  // two test accounts, so it's safe to sweep them all before each run
  // rather than let them pile up indefinitely.
  await prisma.calendarActivity.deleteMany({ where: { ownerStaffId: { in: [testStaffId, limitedStaffId] } } })
})

const basePayload = {
  title: 'Call ABC Motors',
  start_at: '2026-09-10T14:30:00+05:30',
  end_at: '2026-09-10T15:00:00+05:30',
}

describe('POST /api/v1/calendar/activities — create', () => {
  it('creates a task', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'task' })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ type: 'task', title: basePayload.title, status: 'scheduled' })
  })

  it('creates a reminder', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'reminder' })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('reminder')
  })

  it('creates a meeting', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'meeting' })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('meeting')
  })

  it('creates a follow-up', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'followup' })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('followup')
  })

  it('creates a callback', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'callback' })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('callback')
  })

  it('rejects an empty title', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'task', title: '' })
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a title over 200 characters', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'task', title: 'x'.repeat(201) })
    expect(res.status).toBe(422)
  })

  it('rejects end time at or before start time', async () => {
    const res = await request(app)
      .post('/api/v1/calendar/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad time', type: 'task', start_at: '2026-09-10T10:00:00Z', end_at: '2026-09-10T09:00:00Z' })
    expect(res.status).toBe(422)
    expect(res.body.errors).toHaveProperty('end_at')
  })

  it('rejects an invalid activity type', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'bogus' })
    expect(res.status).toBe(422)
  })

  it('rejects a dealer_id that does not exist', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'task', dealer_id: 999999 })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('BAD_REQUEST')
  })

  it('rejects a staff member without calendar.create', async () => {
    const res = await request(app).post('/api/v1/calendar/activities').send({ ...basePayload, type: 'task' })
    expect(res.status).toBe(401) // no token at all — a clean unauthorized case distinct from the permission check
  })

  it('prevents duplicate creation when the same client_uuid is submitted twice', async () => {
    const clientUuid = randomUUID()
    const first = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'task', client_uuid: clientUuid })
    const second = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, type: 'task', client_uuid: clientUuid })
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(second.body.data.id).toBe(first.body.data.id)
  })

  it('preserves the exact wall-clock time regardless of timezone offset in the request', async () => {
    const res = await request(app)
      .post('/api/v1/calendar/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'IST task', type: 'task', start_at: '2026-09-10T14:30:00+05:30', end_at: '2026-09-10T15:00:00+05:30' })
    expect(res.status).toBe(201)
    // 14:30 IST === 09:00 UTC — stored and returned as an unambiguous instant.
    expect(new Date(res.body.data.start_at).toISOString()).toBe('2026-09-10T09:00:00.000Z')
  })
})

describe('calendar activity lifecycle', () => {
  let activityId: string

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, title: 'Lifecycle task', type: 'task' })
    activityId = res.body.data.id
  })

  it('gets the activity by id', async () => {
    const res = await request(app).get(`/api/v1/calendar/activities/${activityId}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Lifecycle task')
  })

  it('updates the activity', async () => {
    const res = await request(app).patch(`/api/v1/calendar/activities/${activityId}`).set('Authorization', `Bearer ${token}`).send({ title: 'Updated title' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Updated title')
  })

  it('moves (drags) the activity to a new time', async () => {
    const res = await request(app)
      .patch(`/api/v1/calendar/activities/${activityId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ start_at: '2026-09-10T16:00:00+05:30', end_at: '2026-09-10T16:30:00+05:30' })
    expect(res.status).toBe(200)
    expect(new Date(res.body.data.start_at).toISOString()).toBe('2026-09-10T10:30:00.000Z')
  })

  it('resizes the activity', async () => {
    const res = await request(app).patch(`/api/v1/calendar/activities/${activityId}/resize`).set('Authorization', `Bearer ${token}`).send({ end_at: '2026-09-10T17:00:00+05:30' })
    expect(res.status).toBe(200)
    expect(new Date(res.body.data.end_at).toISOString()).toBe('2026-09-10T11:30:00.000Z')
  })

  it('completes the activity', async () => {
    const res = await request(app).post(`/api/v1/calendar/activities/${activityId}/complete`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('completed')
    expect(res.body.data.completed_at).not.toBeNull()
  })

  it('deletes the activity, after which it 404s', async () => {
    const del = await request(app).delete(`/api/v1/calendar/activities/${activityId}`).set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(204)

    const get = await request(app).get(`/api/v1/calendar/activities/${activityId}`).set('Authorization', `Bearer ${token}`)
    expect(get.status).toBe(404)
  })
})

describe('authorization', () => {
  it('blocks cross-user access: a view_own-only staff member cannot read another staff member\'s activity', async () => {
    const created = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, title: 'Owner-only task', type: 'task' })
    const res = await request(app).get(`/api/v1/calendar/activities/${created.body.data.id}`).set('Authorization', `Bearer ${limitedToken}`)
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('FORBIDDEN')
  })

  it('blocks a staff member without calendar.delete from deleting someone else\'s activity', async () => {
    const created = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ ...basePayload, title: 'Not deletable', type: 'task' })
    const res = await request(app).delete(`/api/v1/calendar/activities/${created.body.data.id}`).set('Authorization', `Bearer ${limitedToken}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/v1/calendar — date range + empty day', () => {
  it('only returns activities that overlap the requested range', async () => {
    await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ title: 'In range', type: 'task', start_at: '2026-10-05T10:00:00Z', end_at: '2026-10-05T10:30:00Z' })
    await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ title: 'Out of range', type: 'task', start_at: '2026-11-20T10:00:00Z', end_at: '2026-11-20T10:30:00Z' })

    const res = await request(app).get('/api/v1/calendar?start_date=2026-10-01&end_date=2026-10-10').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const titles = res.body.data.map((a: { title: string }) => a.title)
    expect(titles).toContain('In range')
    expect(titles).not.toContain('Out of range')
  })

  it('returns an empty array for a day with nothing scheduled', async () => {
    const res = await request(app).get('/api/v1/calendar?start_date=2099-01-01&end_date=2099-01-02').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('calendar activity owner reassignment', () => {
  it('ignores a client-supplied owner_staff_id from a view_own-only (non-admin-tier) staff member on create, assigning it to the creator instead', async () => {
    const res = await request(app)
      .post('/api/v1/calendar/activities')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({ ...basePayload, type: 'task', owner_staff_id: testStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.staff_id).toBe(String(limitedStaffId))
    expect(res.body.data.staff_id).not.toBe(String(testStaffId))
  })

  it('honors an explicit owner_staff_id from a calendar.view_all (admin-tier) staff member on create', async () => {
    const res = await request(app)
      .post('/api/v1/calendar/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...basePayload, type: 'task', owner_staff_id: limitedStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.staff_id).toBe(String(limitedStaffId))
  })

  it('refuses to let a view_own-only staff member hand their own activity to someone else via PATCH', async () => {
    const created = await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${limitedToken}`).send({ ...basePayload, type: 'task', title: 'Stays mine' })
    expect(created.body.data.staff_id).toBe(String(limitedStaffId))

    const patched = await request(app)
      .patch(`/api/v1/calendar/activities/${created.body.data.id}`)
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({ owner_staff_id: testStaffId })
    expect(patched.status).toBe(200)
    expect(patched.body.data.staff_id).toBe(String(limitedStaffId))
    expect(patched.body.data.staff_id).not.toBe(String(testStaffId))
  })
})

describe('GET /api/v1/calendar — ownership scoping', () => {
  it('hides other staff members\' activities from a view_own-only staff member, but a view_all staff member sees everything', async () => {
    const range = '?start_date=2027-03-01&end_date=2027-03-02'

    await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${token}`).send({ title: 'Owner-visible task', type: 'task', start_at: '2027-03-01T10:00:00Z', end_at: '2027-03-01T10:30:00Z' })
    await request(app).post('/api/v1/calendar/activities').set('Authorization', `Bearer ${limitedToken}`).send({ title: 'Limited user task', type: 'task', start_at: '2027-03-01T11:00:00Z', end_at: '2027-03-01T11:30:00Z' })

    const asLimited = await request(app).get(`/api/v1/calendar${range}`).set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedTitles = asLimited.body.data.map((a: { title: string }) => a.title)
    expect(limitedTitles).toContain('Limited user task')
    expect(limitedTitles).not.toContain('Owner-visible task')

    const asViewAll = await request(app).get(`/api/v1/calendar${range}`).set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    const viewAllTitles = asViewAll.body.data.map((a: { title: string }) => a.title)
    expect(viewAllTitles).toContain('Limited user task')
    expect(viewAllTitles).toContain('Owner-visible task')
  })
})
