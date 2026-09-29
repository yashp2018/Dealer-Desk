import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { TEST_PASSWORD, testStaffId } from './setup'
import './setup'
import { prisma } from '../src/config/database'

const app = createApp()
let token: string

/** A second staff member with only dealers.view_own (no view_all) — used for ownership-scoping checks. */
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
    where: { key: 'dealers_limited_test_role' },
    create: { key: 'dealers_limited_test_role', name: 'Dealers Limited Test Role' },
    update: {},
  })
  const viewOwn = await prisma.permission.upsert({ where: { key: 'dealers.view_own' }, create: { key: 'dealers.view_own', label: 'dealers.view_own' }, update: {} })
  const createPerm = await prisma.permission.upsert({ where: { key: 'dealers.create' }, create: { key: 'dealers.create', label: 'dealers.create' }, update: {} })
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
    where: { email: 'test.dealers.limited@dealer.com' },
    create: { name: 'Dealers Limited Test User', email: 'test.dealers.limited@dealer.com', passwordHash: await bcrypt.hash(TEST_PASSWORD, 4) },
    update: {},
  })
  limitedStaffId = limitedStaff.id
  await prisma.staffRole.upsert({
    where: { staffId_roleId: { staffId: limitedStaff.id, roleId: limitedRole.id } },
    create: { staffId: limitedStaff.id, roleId: limitedRole.id },
    update: {},
  })

  const limitedRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test.dealers.limited@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device-2',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  })
  limitedToken = limitedRes.body.data.token
})

describe('GET /api/v1/dealers', () => {
  it('returns a paginated envelope with the dealers this test staff can see', async () => {
    await prisma.dealer.upsert({
      where: { code: 'TEST-001' },
      create: { code: 'TEST-001', name: 'Test Dealer Co.', displayName: 'Test Dealer Co.', tierId: 1, territoryId: 1, ownerStaffId: testStaffId },
      update: {},
    })

    const res = await request(app).get('/api/v1/dealers').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.meta).toMatchObject({ page: 1, limit: expect.any(Number), total: expect.any(Number) })
    expect(res.body.data.some((d: { code: string }) => d.code === 'TEST-001')).toBe(true)
  })

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/dealers')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHORIZED')
  })

  it('returns 404 for a dealer that does not exist', async () => {
    const res = await request(app).get('/api/v1/dealers/999999').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('dealer ownership scoping', () => {
  it('hides dealers owned by someone else from a view_own-only staff member, but a view_all staff member sees everything', async () => {
    const ownerDealer = await prisma.dealer.upsert({
      where: { code: 'TEST-001' },
      create: { code: 'TEST-001', name: 'Test Dealer Co.', displayName: 'Test Dealer Co.', tierId: 1, territoryId: 1, ownerStaffId: testStaffId },
      update: { ownerStaffId: testStaffId },
    })
    const limitedDealer = await prisma.dealer.upsert({
      where: { code: 'TEST-002' },
      create: { code: 'TEST-002', name: 'Limited Owner Motors', displayName: 'Limited Owner Motors', tierId: 1, territoryId: 1, ownerStaffId: limitedStaffId },
      update: { ownerStaffId: limitedStaffId },
    })

    const asLimited = await request(app).get('/api/v1/dealers').set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedCodes = asLimited.body.data.map((d: { code: string }) => d.code)
    expect(limitedCodes).toContain('TEST-002')
    expect(limitedCodes).not.toContain('TEST-001')

    // limit=200 (the max page size) — this real dev DB accumulates test
    // fixture rows across every test file's run, so the default 20-row page
    // can't be relied on to still include this fixture as the DB grows.
    const asViewAll = await request(app).get('/api/v1/dealers?limit=200').set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    const viewAllCodes = asViewAll.body.data.map((d: { code: string }) => d.code)
    expect(viewAllCodes).toContain('TEST-001')
    expect(viewAllCodes).toContain('TEST-002')

    // A view_own-only staff member can't widen their results with owner_staff_id either.
    const spoofed = await request(app).get(`/api/v1/dealers?owner_staff_id=${testStaffId}`).set('Authorization', `Bearer ${limitedToken}`)
    const spoofedCodes = spoofed.body.data.map((d: { code: string }) => d.code)
    expect(spoofedCodes).not.toContain('TEST-001')

    await Promise.all(
      ['', '/360', '/contacts', '/requests', '/visits', '/timeline'].map(async (suffix) => {
        const res = await request(app).get(`/api/v1/dealers/${ownerDealer.id}${suffix}`).set('Authorization', `Bearer ${limitedToken}`)
        expect(res.status).toBe(403)
      }),
    )

    const ownAccess = await request(app).get(`/api/v1/dealers/${limitedDealer.id}`).set('Authorization', `Bearer ${limitedToken}`)
    expect(ownAccess.status).toBe(200)
  })
})

describe('POST /api/v1/dealers — owner assignment', () => {
  const base = { name: 'Owner Assignment Test Co.', tier_id: 1, territory_id: 1 }
  const testNames = ['Auto-Owned Motors', 'Spoofed Owner Motors', 'Assigned To Someone Else Motors']

  beforeAll(async () => {
    // These tests assert on freshly-created rows and re-run against the real
    // dev DB (no per-run reset), so clear out any leftovers from a prior run
    // first — otherwise the duplicate-name check (409) fires instead of 201.
    await prisma.dealer.deleteMany({ where: { name: { in: testNames } } })
  })

  it('defaults to the creator when no owner is given', async () => {
    const res = await request(app).post('/api/v1/dealers').set('Authorization', `Bearer ${limitedToken}`).send({ ...base, name: 'Auto-Owned Motors' })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
  })

  it('ignores a client-supplied owner_staff_id from a view_own-only (non-admin-tier) staff member', async () => {
    const res = await request(app)
      .post('/api/v1/dealers')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({ ...base, name: 'Spoofed Owner Motors', owner_staff_id: testStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
    expect(res.body.data.owner_staff_id).not.toBe(testStaffId)
  })

  it('honors an explicit owner_staff_id from a dealers.view_all (admin-tier) staff member', async () => {
    const res = await request(app)
      .post('/api/v1/dealers')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base, name: 'Assigned To Someone Else Motors', owner_staff_id: limitedStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
  })
})
