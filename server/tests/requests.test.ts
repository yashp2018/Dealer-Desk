import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { TEST_PASSWORD, testStaffId } from './setup'
import './setup'
import { prisma } from '../src/config/database'

const app = createApp()
let token: string

/** A second staff member with only requests.view_own (no view_all) — used for ownership-scoping checks. */
let limitedToken: string
let limitedStaffId: number
let requestTypeId: number
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
    where: { key: 'requests_limited_test_role' },
    create: { key: 'requests_limited_test_role', name: 'Requests Limited Test Role' },
    update: {},
  })
  const viewOwn = await prisma.permission.upsert({ where: { key: 'requests.view_own' }, create: { key: 'requests.view_own', label: 'requests.view_own' }, update: {} })
  const createPerm = await prisma.permission.upsert({ where: { key: 'requests.create' }, create: { key: 'requests.create', label: 'requests.create' }, update: {} })
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
    where: { email: 'test.requests.limited@dealer.com' },
    create: { name: 'Requests Limited Test User', email: 'test.requests.limited@dealer.com', passwordHash: await bcrypt.hash(TEST_PASSWORD, 4) },
    update: {},
  })
  limitedStaffId = limitedStaff.id
  await prisma.staffRole.upsert({
    where: { staffId_roleId: { staffId: limitedStaff.id, roleId: limitedRole.id } },
    create: { staffId: limitedStaff.id, roleId: limitedRole.id },
    update: {},
  })

  const limitedRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test.requests.limited@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device-2',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  })
  limitedToken = limitedRes.body.data.token

  const requestType = await prisma.requestType.upsert({
    where: { slug: 'test-request-type' },
    create: { name: 'Test Request Type', slug: 'test-request-type', icon: 'wrench', color: '#000000', defaultPriority: 3, slaHours: 24 },
    update: {},
  })
  requestTypeId = requestType.id

  const dealer = await prisma.dealer.upsert({
    where: { code: 'TEST-REQ-001' },
    create: { code: 'TEST-REQ-001', name: 'Requests Test Dealer', displayName: 'Requests Test Dealer', tierId: 1, territoryId: 1, ownerStaffId: testStaffId },
    update: {},
  })
  dealerId = dealer.id
})

describe('GET /api/v1/requests', () => {
  it('returns a paginated envelope', async () => {
    const res = await request(app).get('/api/v1/requests').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.meta).toMatchObject({ page: 1, limit: expect.any(Number), total: expect.any(Number) })
  })

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/requests')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHORIZED')
  })

  it('returns 404 for a request that does not exist', async () => {
    const res = await request(app).get('/api/v1/requests/999999').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('request ownership scoping', () => {
  it('hides requests owned by someone else from a view_own-only staff member, but a view_all staff member sees everything', async () => {
    const ownerRequest = await prisma.request.upsert({
      where: { refNo: 'TEST-REQ-OWN-001' },
      create: { refNo: 'TEST-REQ-OWN-001', title: 'Owner Request', typeId: requestTypeId, dealerId, ownerStaffId: testStaffId },
      update: { ownerStaffId: testStaffId },
    })
    const limitedRequest = await prisma.request.upsert({
      where: { refNo: 'TEST-REQ-OWN-002' },
      create: { refNo: 'TEST-REQ-OWN-002', title: 'Limited Request', typeId: requestTypeId, dealerId, ownerStaffId: limitedStaffId },
      update: { ownerStaffId: limitedStaffId },
    })

    const asLimited = await request(app).get('/api/v1/requests').set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedRefs = asLimited.body.data.map((r: { ref_no: string }) => r.ref_no)
    expect(limitedRefs).toContain('TEST-REQ-OWN-002')
    expect(limitedRefs).not.toContain('TEST-REQ-OWN-001')

    // limit=200 (the max page size) — this real dev DB accumulates test
    // fixture rows across every test file's run, so the default 20-row page
    // can't be relied on to still include this fixture as the DB grows.
    const asViewAll = await request(app).get('/api/v1/requests?limit=200').set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    const viewAllRefs = asViewAll.body.data.map((r: { ref_no: string }) => r.ref_no)
    expect(viewAllRefs).toContain('TEST-REQ-OWN-001')
    expect(viewAllRefs).toContain('TEST-REQ-OWN-002')

    // A view_own-only staff member can't widen their results with owner_staff_id either.
    const spoofed = await request(app).get(`/api/v1/requests?owner_staff_id=${testStaffId}`).set('Authorization', `Bearer ${limitedToken}`)
    const spoofedRefs = spoofed.body.data.map((r: { ref_no: string }) => r.ref_no)
    expect(spoofedRefs).not.toContain('TEST-REQ-OWN-001')

    await Promise.all(
      ['', '/details', '/lines', '/timeline', '/escalations'].map(async (suffix) => {
        const res = await request(app).get(`/api/v1/requests/${ownerRequest.id}${suffix}`).set('Authorization', `Bearer ${limitedToken}`)
        expect(res.status).toBe(403)
      }),
    )

    const ownAccess = await request(app).get(`/api/v1/requests/${limitedRequest.id}`).set('Authorization', `Bearer ${limitedToken}`)
    expect(ownAccess.status).toBe(200)
  })
})

describe('POST /api/v1/requests — owner assignment', () => {
  const titles = ['Owner Assignment Test — unassigned', 'Owner Assignment Test — spoofed', 'Owner Assignment Test — honored']
  const base = (title: string) => ({ dealer_id: dealerId, type_id: requestTypeId, title })

  beforeAll(async () => {
    // Each test below POSTs through the real create endpoint (not an
    // upsert), so a fresh row would otherwise pile up on every test run —
    // clear last run's rows first, same fix dealers.test.ts already uses.
    await prisma.request.deleteMany({ where: { title: { in: titles } } })
  })

  it('leaves the request unassigned when no owner is given (the Control Room "Unassigned" queue relies on this)', async () => {
    const res = await request(app).post('/api/v1/requests').set('Authorization', `Bearer ${limitedToken}`).send(base(titles[0]))
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBeNull()
  })

  it('ignores a client-supplied owner_staff_id from a view_own-only (non-admin-tier) staff member, assigning it to the creator instead', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({ ...base(titles[1]), owner_staff_id: testStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
    expect(res.body.data.owner_staff_id).not.toBe(testStaffId)
  })

  it('honors an explicit owner_staff_id from a requests.view_all (admin-tier) staff member', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base(titles[2]), owner_staff_id: limitedStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
  })
})
