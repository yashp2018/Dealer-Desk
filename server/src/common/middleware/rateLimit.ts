import rateLimit from 'express-rate-limit'
import { env } from '../../config/env'

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.', code: 'TOO_MANY_REQUESTS' },
})

/** Tighter limit for auth endpoints to slow down credential-stuffing / brute force. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.', code: 'TOO_MANY_REQUESTS' },
})
