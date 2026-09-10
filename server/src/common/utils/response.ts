import { Response } from 'express'

export interface Meta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  [key: string]: unknown
}

/**
 * Every successful response uses this envelope. The frontend's axios
 * response interceptor (src/api/client.ts) unwraps `data` automatically,
 * so route handlers should always call `ok()` / `created()` rather than
 * `res.json()` directly.
 */
export function ok<T>(res: Response, data: T, message = 'Success', meta?: Meta, status = 200): Response {
  return res.status(status).json({ message, data, ...(meta ? { meta } : {}) })
}

export function created<T>(res: Response, data: T, message = 'Created'): Response {
  return ok(res, data, message, undefined, 201)
}

export function noContent(res: Response): Response {
  return res.status(204).send()
}

export function paginated<T>(res: Response, data: T[], meta: Required<Pick<Meta, 'page' | 'limit' | 'total'>>): Response {
  const totalPages = meta.limit > 0 ? Math.ceil(meta.total / meta.limit) : 0
  return ok(res, data, 'Success', { ...meta, totalPages })
}
