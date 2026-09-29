import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { TEST_PASSWORD, testStaffId } from './setup'
import './setup'
import { prisma } from '../src/config/database'

const app = createApp()
let token: string

/**
 * A second staff member with NO extra permissions at all (just the base
 * authenticated account). /dashboard, /queue, /search, and /sync/changes
 * have no requirePermission gate of their own — their scoping falls back to
 * "owner_staff_id === actor.id" purely because this account lacks every
 * *.view_all permission, which is exactly the case these tests exercise.
 */
let limitedToken: string
let limitedStaffId: number
let requestTypeId: number
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

  const limitedStaff = await prisma.staff.upsert({
    where: { email: 'test.dashboard.limited@dealer.com' },
    create: { name: 'Dashboard Limited Test User', email: 'test.dashboard.limited@dealer.com', passwordHash: await bcrypt.hash(TEST_PASSWORD, 4) },
    update: {},
  })
  limitedStaffId = limitedStaff.id

  const limitedRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test.dashboard.limited@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device-2',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  })
  limitedToken = limitedRes.body.data.token

  const requestType = await prisma.requestType.upsert({
    where: { slug: 'test-dashboard-type' },
    create: { name: 'Test Dashboard Type', slug: 'test-dashboard-type', icon: 'wrench', color: '#000000', defaultPriority: 3, slaHours: 24 },
    update: {},
  })
  requestTypeId = requestType.id

  const visitType = await prisma.visitType.upsert({ where: { id: 999998 }, create: { id: 999998, name: 'Test Dashboard Visit Type' }, update: {} })
  visitTypeId = visitType.id

  const dealer = await prisma.dealer.upsert({
    where: { code: 'TEST-DASH-001' },
    create: { code: 'TEST-DASH-001', name: 'DashSync Test Dealer', displayName: 'DashSync Test Dealer', tierId: 1, territoryId: 1, ownerStaffId: testStaffId },
    update: {},
  })
  dealerId = dealer.id

  await prisma.request.upsert({
    where: { refNo: 'TEST-DASH-REQ-001' },
    create: { refNo: 'TEST-DASH-REQ-001', title: 'DashSync Owner Request', typeId: requestTypeId, dealerId, ownerStaffId: testStaffId, status: 'new' },
    update: { ownerStaffId: testStaffId, status: 'new' },
  })
  await prisma.request.upsert({
    where: { refNo: 'TEST-DASH-REQ-002' },
    create: { refNo: 'TEST-DASH-REQ-002', title: 'DashSync Limited Request', typeId: requestTypeId, dealerId, ownerStaffId: limitedStaffId, status: 'new' },
    update: { ownerStaffId: limitedStaffId, status: 'new' },
  })
  await prisma.visit.upsert({
    where: { refNo: 'TEST-DASH-VIS-001' },
    create: { refNo: 'TEST-DASH-VIS-001', title: 'DashSync Owner Visit', dealerId, visitTypeId, scheduledAt: new Date(), ownerStaffId: testStaffId },
    update: { ownerStaffId: testStaffId },
  })
  await prisma.visit.upsert({
    where: { refNo: 'TEST-DASH-VIS-002' },
    create: { refNo: 'TEST-DASH-VIS-002', title: 'DashSync Limited Visit', dealerId, visitTypeId, scheduledAt: new Date(), ownerStaffId: limitedStaffId },
    update: { ownerStaffId: limitedStaffId },
  })
})

describe('GET /queue — ownership scoping', () => {
  it('scopes the request list and hides the team leaderboard from a view_own-only caller', async () => {
    const asLimited = await request(app).get('/api/v1/queue').set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedRefs = asLimited.body.data.requests.map((r: { ref_no: string }) => r.ref_no)
    expect(limitedRefs).toContain('TEST-DASH-REQ-002')
    expect(limitedRefs).not.toContain('TEST-DASH-REQ-001')
    expect(asLimited.body.data.team).toEqual([])

    const asViewAll = await request(app).get('/api/v1/queue').set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    const viewAllRefs = asViewAll.body.data.requests.map((r: { ref_no: string }) => r.ref_no)
    expect(viewAllRefs).toContain('TEST-DASH-REQ-001')
    expect(viewAllRefs).toContain('TEST-DASH-REQ-002')
    expect(asViewAll.body.data.team.length).toBeGreaterThan(0)
  })
})

describe('GET /dashboard — ownership scoping', () => {
  it('scopes today.open_requests and hides the team performance leaderboard from a view_own-only caller', async () => {
    const asLimited = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedRefs = asLimited.body.data.urgent_requests.map((r: { ref_no: string }) => r.ref_no)
    expect(limitedRefs).not.toContain('TEST-DASH-REQ-001')
    expect(asLimited.body.data.performance.team).toEqual([])

    const asViewAll = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    expect(asViewAll.body.data.performance.team.length).toBeGreaterThan(0)
  })
})

describe('GET /search — ownership scoping', () => {
  it('hides requests and visits owned by someone else from a view_own-only caller', async () => {
    const asLimited = await request(app).get('/api/v1/search?q=DashSync').set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedRequestLabels = asLimited.body.data.requests.map((r: { label: string }) => r.label)
    expect(limitedRequestLabels.some((l: string) => l.includes('TEST-DASH-REQ-002'))).toBe(true)
    expect(limitedRequestLabels.some((l: string) => l.includes('TEST-DASH-REQ-001'))).toBe(false)

    const asViewAll = await request(app).get('/api/v1/search?q=DashSync').set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    const viewAllRequestLabels = asViewAll.body.data.requests.map((r: { label: string }) => r.label)
    expect(viewAllRequestLabels.some((l: string) => l.includes('TEST-DASH-REQ-001'))).toBe(true)
    expect(viewAllRequestLabels.some((l: string) => l.includes('TEST-DASH-REQ-002'))).toBe(true)
  })
})

describe('GET /sync/changes — ownership scoping', () => {
  it('only reports requests and visits the caller owns, unless they hold view_all', async () => {
    const asLimited = await request(app).get('/api/v1/sync/changes').set('Authorization', `Bearer ${limitedToken}`)
    expect(asLimited.status).toBe(200)
    const limitedRequest = await prisma.request.findUnique({ where: { refNo: 'TEST-DASH-REQ-001' } })
    const limitedIds = asLimited.body.data.changes.filter((c: { entity_type: string }) => c.entity_type === 'request').map((c: { entity_id: number }) => c.entity_id)
    expect(limitedIds).not.toContain(limitedRequest!.id)

    const asViewAll = await request(app).get('/api/v1/sync/changes').set('Authorization', `Bearer ${token}`)
    expect(asViewAll.status).toBe(200)
    const viewAllIds = asViewAll.body.data.changes.filter((c: { entity_type: string }) => c.entity_type === 'request').map((c: { entity_id: number }) => c.entity_id)
    expect(viewAllIds).toContain(limitedRequest!.id)
  })
})
