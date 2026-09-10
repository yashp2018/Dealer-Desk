import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { TEST_PASSWORD } from './setup'
import './setup'

const app = createApp()

describe('POST /api/v1/auth/login', () => {
  const loginPayload = {
    email: 'test.user@dealer.com',
    password: TEST_PASSWORD,
    device_id: 'test-device',
    platform: 'web',
    app_version: '1.0.0',
    os_version: 'test',
  }

  it('rejects an invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ ...loginPayload, password: 'wrong-password' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHORIZED')
  })

  it('rejects a malformed payload before hitting the database', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email' })
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('logs in with valid credentials and returns the expected AuthData shape', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(loginPayload)

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      token: expect.any(String),
      expires_in: expect.any(Number),
      staff: { email: loginPayload.email },
      ref_block: expect.any(String),
    })
    // Refresh token must be set as an httpOnly cookie, never in the JSON body.
    expect(res.body.data.refreshToken).toBeUndefined()
    expect(res.headers['set-cookie']?.[0]).toMatch(/refresh_token=.+HttpOnly/i)
  })

  it('rejects unauthenticated access to a protected route', async () => {
    const res = await request(app).get('/api/v1/dealers')
    expect(res.status).toBe(401)
  })
})
 