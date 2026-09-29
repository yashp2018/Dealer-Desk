import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { TEST_PASSWORD } from './setup'
import './setup'
import { prisma } from '../src/config/database'

const app = createApp()
let token: string

/** A staff member with no services.* or providers.* permissions at all — used for permission-gate checks. */
let noPermsToken: string

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

  const noPermsRole = await prisma.role.upsert({
    where: { key: 'services_no_perms_test_role' },
    create: { key: 'services_no_perms_test_role', name: 'Services No-Perms Test Role' },
    update: {},
  })
  const noPermsStaff = await prisma.staff.upsert({
    where: { email: 'test.services.noperms@dealer.com' },
    create: { name: 'Services No-Perms Test User', email: 'test.services.noperms@dealer.com', passwordHash: await bcrypt.hash(TEST_PASSWORD, 4) },
    update: {},
  })
  await prisma.staffRole.upsert({
    where: { staffId_roleId: { staffId: noPermsStaff.id, roleId: noPermsRole.id } },
    create: { staffId: noPermsStaff.id, roleId: noPermsRole.id },
    update: {},
  })

  const noPermsRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test.services.noperms@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device-2',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  })
  noPermsToken = noPermsRes.body.data.token

  // These tests assert on freshly-created rows and re-run against the real
  // dev DB (no per-run reset), so clear out any leftovers from a prior run
  // first — otherwise the slug/name-uniqueness check (409) fires instead of 201.
  await prisma.service.deleteMany({ where: { name: { in: ['Active Without Provider Test Service', 'Ownership Test Service'] } } })
  await prisma.provider.deleteMany({ where: { name: { in: ['Invalid Contact Test Provider', 'Ownership Test Provider'] } } })
})

describe('GET /api/v1/services', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/services')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHORIZED')
  })

  it('rejects a staff member without services.view_all', async () => {
    const res = await request(app).get('/api/v1/services').set('Authorization', `Bearer ${noPermsToken}`)
    expect(res.status).toBe(403)
  })

  it('returns a paginated envelope for a staff member with services.view_all', async () => {
    const res = await request(app).get('/api/v1/services').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.meta).toMatchObject({ page: expect.any(Number), limit: expect.any(Number), total: expect.any(Number) })
  })

  it('returns 404 for a service that does not exist', async () => {
    const res = await request(app).get('/api/v1/services/999999').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/services', () => {
  it('rejects a staff member without services.create', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${noPermsToken}`)
      .send({ name: 'Should Not Be Created' })
    expect(res.status).toBe(403)
  })

  it('rejects an empty name', async () => {
    const res = await request(app).post('/api/v1/services').set('Authorization', `Bearer ${token}`).send({ name: '' })
    expect(res.status).toBe(422)
  })

  it('rejects setting status to active with no provider assigned', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Active Without Provider Test Service', status: 'active' })
    expect(res.status).toBe(400)
  })

  it('creates, fetches, updates, and archives a service end-to-end', async () => {
    const create = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ownership Test Service', shortDescription: 'A test service' })
    expect(create.status).toBe(201)
    expect(create.body.data.name).toBe('Ownership Test Service')
    const id = create.body.data.id

    const get = await request(app).get(`/api/v1/services/${id}`).set('Authorization', `Bearer ${token}`)
    expect(get.status).toBe(200)
    expect(get.body.data.id).toBe(id)

    const update = await request(app)
      .patch(`/api/v1/services/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shortDescription: 'Updated description' })
    expect(update.status).toBe(200)
    expect(update.body.data.shortDescription).toBe('Updated description')

    const remove = await request(app).delete(`/api/v1/services/${id}`).set('Authorization', `Bearer ${token}`)
    expect(remove.status).toBe(200)

    // This test account isn't admin-role, so deletion is a soft-archive —
    // the record still exists afterwards, just archived.
    const afterRemove = await request(app).get(`/api/v1/services/${id}`).set('Authorization', `Bearer ${token}`)
    expect(afterRemove.status).toBe(200)
    expect(afterRemove.body.data.status).toBe('archived')
  })
})

describe('GET /api/v1/providers', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/providers')
    expect(res.status).toBe(401)
  })

  it('rejects a staff member without providers.view_all', async () => {
    const res = await request(app).get('/api/v1/providers').set('Authorization', `Bearer ${noPermsToken}`)
    expect(res.status).toBe(403)
  })

  it('returns a paginated envelope for a staff member with providers.view_all', async () => {
    const res = await request(app).get('/api/v1/providers').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

describe('POST /api/v1/providers', () => {
  it('rejects a staff member without providers.create', async () => {
    const res = await request(app)
      .post('/api/v1/providers')
      .set('Authorization', `Bearer ${noPermsToken}`)
      .send({ name: 'Should Not Be Created' })
    expect(res.status).toBe(403)
  })

  it('rejects an invalid contact email', async () => {
    const res = await request(app)
      .post('/api/v1/providers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Invalid Contact Test Provider', contact: { email: 'not-an-email' } })
    expect(res.status).toBe(422)
  })

  it('creates, fetches, and deletes a provider end-to-end', async () => {
    const create = await request(app)
      .post('/api/v1/providers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ownership Test Provider' })
    expect(create.status).toBe(201)
    expect(create.body.data.name).toBe('Ownership Test Provider')
    const id = create.body.data.id

    const get = await request(app).get(`/api/v1/providers/${id}`).set('Authorization', `Bearer ${token}`)
    expect(get.status).toBe(200)

    const remove = await request(app).delete(`/api/v1/providers/${id}`).set('Authorization', `Bearer ${token}`)
    expect(remove.status).toBe(200)

    // A provider with no services attached is hard-deleted regardless of role.
    const afterRemove = await request(app).get(`/api/v1/providers/${id}`).set('Authorization', `Bearer ${token}`)
    expect(afterRemove.status).toBe(404)
  })
})
