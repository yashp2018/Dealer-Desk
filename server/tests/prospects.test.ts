import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { TEST_PASSWORD, testStaffId } from './setup'
import './setup'
import { prisma } from '../src/config/database'

const app = createApp()
let token: string

/** A second staff member with only prospects.view_own (no view_all) — used for ownership-scoping checks. */
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
    where: { key: 'prospects_limited_test_role' },
    create: { key: 'prospects_limited_test_role', name: 'Prospects Limited Test Role' },
    update: {},
  })
  const viewOwn = await prisma.permission.upsert({ where: { key: 'prospects.view_own' }, create: { key: 'prospects.view_own', label: 'prospects.view_own' }, update: {} })
  const createPerm = await prisma.permission.upsert({ where: { key: 'prospects.create' }, create: { key: 'prospects.create', label: 'prospects.create' }, update: {} })
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
    where: { email: 'test.prospects.limited@dealer.com' },
    create: { name: 'Prospects Limited Test User', email: 'test.prospects.limited@dealer.com', passwordHash: await bcrypt.hash(TEST_PASSWORD, 4) },
    update: {},
  })
  limitedStaffId = limitedStaff.id
  await prisma.staffRole.upsert({
    where: { staffId_roleId: { staffId: limitedStaff.id, roleId: limitedRole.id } },
    create: { staffId: limitedStaff.id, roleId: limitedRole.id },
    update: {},
  })

  const limitedRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test.prospects.limited@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device-2',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  })
  limitedToken = limitedRes.body.data.token
})

describe('GET /api/v1/prospects', () => {
  it('returns a paginated envelope', async () => {
    const res = await request(app).get('/api/v1/prospects').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.meta).toMatchObject({ page: 1, limit: expect.any(Number), total: expect.any(Number) })
  })

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/prospects')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHORIZED')
  })

  it('returns 404 for a prospect that does not exist', async () => {
    const res = await request(app).get('/api/v1/prospects/999999').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('prospect ownership scoping', () => {
  it('hides prospects owned by someone else from a view_own-only staff member, but a view_all staff member sees everything', async () => {
    const ownerProspect = await prisma.prospect.upsert({
      where: { refNo: 'TEST-PROS-OWN-001' },
      create: { refNo: 'TEST-PROS-OWN-001', companyName: 'Owner Prospect Co.', ownerStaffId: testStaffId },
      update: { ownerStaffId: testStaffId },
    })
    const limitedProspect = await prisma.prospect.upsert({
      where: { refNo: 'TEST-PROS-OWN-002' },
      create: { refNo: 'TEST-PROS-OWN-002', companyName: 'Limited Prospect Co.', ownerStaffId: limitedStaffId },
      update: { ownerStaffId: limitedStaffId },
    })

    const asLimited = await request(app).get('/api/v1/prospects').set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedRefs = asLimited.body.data.map((p: { ref_no: string }) => p.ref_no)
    expect(limitedRefs).toContain('TEST-PROS-OWN-002')
    expect(limitedRefs).not.toContain('TEST-PROS-OWN-001')

    // limit=200 (the max page size) — this real dev DB accumulates test
    // fixture rows across every test file's run, so the default 20-row page
    // can't be relied on to still include this fixture as the DB grows.
    const asViewAll = await request(app).get('/api/v1/prospects?limit=200').set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    const viewAllRefs = asViewAll.body.data.map((p: { ref_no: string }) => p.ref_no)
    expect(viewAllRefs).toContain('TEST-PROS-OWN-001')
    expect(viewAllRefs).toContain('TEST-PROS-OWN-002')

    // A view_own-only staff member can't widen their results with owner_staff_id either.
    const spoofed = await request(app).get(`/api/v1/prospects?owner_staff_id=${testStaffId}`).set('Authorization', `Bearer ${limitedToken}`)
    const spoofedRefs = spoofed.body.data.map((p: { ref_no: string }) => p.ref_no)
    expect(spoofedRefs).not.toContain('TEST-PROS-OWN-001')

    await Promise.all(
      ['', '/checklist', '/visits', '/requests'].map(async (suffix) => {
        const res = await request(app).get(`/api/v1/prospects/${ownerProspect.id}${suffix}`).set('Authorization', `Bearer ${limitedToken}`)
        expect(res.status).toBe(403)
      }),
    )

    const ownAccess = await request(app).get(`/api/v1/prospects/${limitedProspect.id}`).set('Authorization', `Bearer ${limitedToken}`)
    expect(ownAccess.status).toBe(200)
  })
})

describe('POST /api/v1/prospects — owner assignment', () => {
  const names = ['Owner Assignment Test — default', 'Owner Assignment Test — spoofed', 'Owner Assignment Test — honored']
  const base = (company_name: string) => ({ company_name })

  beforeAll(async () => {
    // Each test below POSTs through the real create endpoint (not an
    // upsert), so a fresh row would otherwise pile up on every test run —
    // clear last run's rows first, same fix dealers.test.ts already uses.
    await prisma.prospect.deleteMany({ where: { companyName: { in: names } } })
  })

  it('defaults to the creator when no owner is given (view_own-only staff can only submit their own owner_staff_id anyway)', async () => {
    const res = await request(app).post('/api/v1/prospects').set('Authorization', `Bearer ${limitedToken}`).send({ ...base(names[0]), owner_staff_id: limitedStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
  })

  it('ignores a client-supplied owner_staff_id from a view_own-only (non-admin-tier) staff member', async () => {
    const res = await request(app)
      .post('/api/v1/prospects')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({ ...base(names[1]), owner_staff_id: testStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
    expect(res.body.data.owner_staff_id).not.toBe(testStaffId)
  })

  it('honors an explicit owner_staff_id from a prospects.view_all (admin-tier) staff member', async () => {
    const res = await request(app)
      .post('/api/v1/prospects')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base(names[2]), owner_staff_id: limitedStaffId })
    expect(res.status).toBe(201)
    expect(res.body.data.owner_staff_id).toBe(limitedStaffId)
  })
})
