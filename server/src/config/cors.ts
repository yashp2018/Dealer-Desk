import { CorsOptions } from 'cors'
import { env } from './env'

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser tools (curl, server-to-server, mobile app) with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS policy`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'If-None-Match', 'Idempotency-Key', 'X-Request-Id', 'X-CSRF-Token'],
  exposedHeaders: ['ETag', 'X-Request-Id'],
}
