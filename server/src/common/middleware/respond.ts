/**
 * common/middleware/respond.ts
 *
 * Enforces the { message, data, meta } envelope that client.ts unwraps.
 * Every successful controller response MUST go through here.
 */

import { Response } from 'express'

export function respond<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
  meta?: Record<string, unknown>,
): void {
  res.status(statusCode).json({
    message,
    data,
    meta: { server_time: new Date().toISOString(), ...meta },
  })
}
