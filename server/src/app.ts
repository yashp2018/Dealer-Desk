import express, { Application } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { env } from './config/env'
import { corsOptions } from './config/cors'
import { httpLogger } from './config/logger'
import { globalRateLimiter } from './common/middleware/rateLimit'
import { errorHandler, notFoundHandler } from './common/middleware/errorHandler'
import { apiRouter } from './routes/index'

export function createApp(): Application {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  // Cast: helmet/compression/cookie-parser/pino-http each ship their own
  // handler types (built against plain Node http types rather than
  // express-serve-static-core's Request/Response), which trips up
  // TypeScript's overload resolution for app.use() even though the
  // handlers are runtime-compatible with Express. This is a well-known
  // friction point between Express 4's typings and several popular
  // middleware packages — not a functional issue.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(helmet() as any)
  app.use(cors(corsOptions))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(compression() as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(express.json({ limit: '2mb' }) as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(express.urlencoded({ extended: true, limit: '2mb' }) as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(cookieParser() as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(httpLogger as any)
  app.use(globalRateLimiter)

  // Root-level health check, outside API versioning, for load balancers.
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }))

  app.use(env.API_PREFIX, apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
