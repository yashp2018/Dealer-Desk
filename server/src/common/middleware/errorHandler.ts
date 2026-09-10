import { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/AppError'
import { isProd } from '../../config/env'
import { logger } from '../../config/logger'

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.id as string | undefined

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, err.message)
    }
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      ...(err.errors ? { errors: err.errors } : {}),
      ...(requestId ? { requestId } : {}),
    })
    return
  }

  // Unknown/unexpected error — never leak internals.
  logger.error({ err, requestId }, 'Unhandled error')
  res.status(500).json({
    message: isProd ? 'An unexpected error occurred' : String((err as Error)?.message ?? err),
    code: 'INTERNAL_ERROR',
    requestId,
  })
}
