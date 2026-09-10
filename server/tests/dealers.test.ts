import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { TEST_PASSWORD, testStaffId } from './setup'
import './setup'
import { prisma } from '../src/config/database'

const app = createApp()
let token: string

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
