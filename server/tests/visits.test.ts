import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { TEST_PASSWORD, testStaffId } from './setup'
import './setup'
import { prisma } from '../src/config/database'

const app = createApp()
let token: string

/** A second staff member with only visits.view_own (no view_all) — used for ownership-scoping checks. */
let limitedToken: string
let limitedStaffId: number
let visitTypeId: number
let dealerId: number

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
    where: { key: 'visits_limited_test_role' },
    create: { key: 'visits_limited_test_role', name: 'Visits Limited Test Role' },
    update: {},
  })
  const viewOwn = await prisma.permission.upsert({ where: { key: 'visits.view_own' }, create: { key: 'visits.view_own', label: 'visits.view_own' }, update: {} })
  const createPerm = await prisma.permission.upsert({ where: { key: 'visits.create' }, create: { key: 'visits.create', label: 'visits.create' }, update: {} })
  await Promise.all(
    [viewOwn, createPerm].map((p) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: limitedRole.id, permissionId: p.id } },
        create: { roleId: limitedRole.id, permissionId: p.id },
        update: {},
      }),
    ),
  )
  const limitedStaff = await prisma.staff.upsert({
    where: { email: 'test.visits.limited@dealer.com' },
    create: { name: 'Visits Limited Test User', email: 'test.visits.limited@dealer.com', passwordHash: await bcrypt.hash(TEST_PASSWORD, 4) },
    update: {},
  })
  limitedStaffId = limitedStaff.id
  await prisma.staffRole.upsert({
    where: { staffId_roleId: { staffId: limitedStaff.id, roleId: limitedRole.id } },
    create: { staffId: limitedStaff.id, roleId: limitedRole.id },
    update: {},
  })

  const limitedRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test.visits.limited@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device-2',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  })
  limitedToken = limitedRes.body.data.token

  const visitType = await prisma.visitType.upsert({
    where: { id: 999999 },
    create: { id: 999999, name: 'Test Visit Type' },
    update: {},
  })
  visitTypeId = visitType.id

  const dealer = await prisma.dealer.upsert({
    where: { code: 'TEST-VIS-001' },
    create: { code: 'TEST-VIS-001', name: 'Visits Test Dealer', displayName: 'Visits Test Dealer', tierId: 1, territoryId: 1, ownerStaffId: testStaffId },
    update: {},
  })
  dealerId = dealer.id
})

describe('GET /api/v1/visits', () => {
  it('returns a paginated envelope', async () => {
    const res = await request(app).get('/api/v1/visits').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.meta).toMatchObject({ page: 1, limit: expect.any(Number), total: expect.any(Number) })
  })

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/visits')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHORIZED')
  })

  it('returns 404 for a visit that does not exist', async () => {
    const res = await request(app).get('/api/v1/visits/999999').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('visit ownership scoping', () => {
  it('hides visits owned by someone else from a view_own-only staff member, but a view_all staff member sees everything', async () => {
    const ownerVisit = await prisma.visit.upsert({
      where: { refNo: 'TEST-VIS-OWN-001' },
      create: { refNo: 'TEST-VIS-OWN-001', dealerId, visitTypeId, scheduledAt: new Date(), ownerStaffId: testStaffId },
      update: { ownerStaffId: testStaffId },
    })
    const limitedVisit = await prisma.visit.upsert({
      where: { refNo: 'TEST-VIS-OWN-002' },
      create: { refNo: 'TEST-VIS-OWN-002', dealerId, visitTypeId, scheduledAt: new Date(), ownerStaffId: limitedStaffId },
      update: { ownerStaffId: limitedStaffId },
    })

    const asLimited = await request(app).get('/api/v1/visits').set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedRefs = asLimited.body.data.map((v: { ref_no: string }) => v.ref_no)
    expect(limitedRefs).toContain('TEST-VIS-OWN-002')
    expect(limitedRefs).not.toContain('TEST-VIS-OWN-001')

    // limit=200 (the max page size) — this real dev DB accumulates test
    // fixture rows across every test file's run, so the default 20-row page
    // can't be relied on to still include this fixture as the DB grows.
    const asViewAll = await request(app).get('/api/v1/visits?limit=200').set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    const viewAllRefs = asViewAll.body.data.map((v: { ref_no: string }) => v.ref_no)
    expect(viewAllRefs).toContain('TEST-VIS-OWN-001')
    expect(viewAllRefs).toContain('TEST-VIS-OWN-002')

    // A view_own-only staff member can't widen their results with owner_staff_id either.
    const spoofed = await request(app).get(`/api/v1/visits?owner_staff_id=${testStaffId}`).set('Authorization', `Bearer ${limitedToken}`)
    const spoofedRefs = spoofed.body.data.map((v: { ref_no: string }) => v.ref_no)
    expect(spoofedRefs).not.toContain('TEST-VIS-OWN-001')

    await Promise.all(
      ['', '/timeline', '/agenda', '/attachments'].map(async (suffix) => {
        const res = await request(app).get(`/api/v1/visits/${ownerVisit.id}${suffix}`).set('Authorization', `Bearer ${limitedToken}`)
        expect(res.status).toBe(403)
      }),
    )

    const ownAccess = await request(app).get(`/api/v1/visits/${limitedVisit.id}`).set('Authorization', `Bearer ${limitedToken}`)
    expect(ownAccess.status).toBe(200)
  })
})

describe('POST /api/v1/visits — owner assignment', () => {
  const titles = ['Owner Assignment Test — default', 'Owner Assignment Test — spoofed', 'Owner Assignment Test — honored']
  const base = (title: string) => ({ dealer_id: dealerId, visit_type_id: visitTypeId, scheduled_at: new Date(Date.now() + 3600_000).toISOString(), title })

  beforeAll(async () => {
    // Each test below POSTs through the real create endpoint (not an
    // upsert), so a fresh row would otherwise pile up on every test run —
    // clear last run's rows first, same fix dealers.test.ts already uses.
    await prisma.visit.deleteMany({ where: { title: { in: titles } } })
  })

  it('defaults to the creator when no owner is given', async () => {
    const res = await request(app).post('/api/v1/visits').set('Authorization', `Bearer ${limitedToken}`).send(base(titles[0]))
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
  })

  it('ignores a client-supplied owner_staff_id from a view_own-only (non-admin-tier) staff member', async () => {
    const res = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({ ...base(titles[1]), owner_staff_id: testStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
    expect(res.body.data.owner_staff_id).not.toBe(testStaffId)
  })

  it('honors an explicit owner_staff_id from a visits.view_all (admin-tier) staff member', async () => {
    const res = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base(titles[2]), owner_staff_id: limitedStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
  })
})
