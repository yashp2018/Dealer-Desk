import pino from 'pino'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'
import { env, isProd, isTest } from './env'

// pino-pretty runs in a worker thread; its own module resolution needs the
// bare package name (not a resolved directory path — that trips Node's
// strict ESM resolver via pino's `real-require` loader).
const pinoPrettyTarget = isProd || isTest ? undefined : 'pino-pretty'

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      '*.password',
      '*.passwordHash',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  transport: isProd || !pinoPrettyTarget
    ? undefined
    : {
        target: pinoPrettyTarget,
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
})

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id']
    const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID()
    res.setHeader('x-request-id', id)
    return id
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
})
