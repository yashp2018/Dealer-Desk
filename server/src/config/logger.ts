import pino from 'pino'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'
import { resolve } from 'path'
import { env, isProd } from './env'

const pinoPrettyTarget = isProd
  ? undefined
  : resolve(__dirname, '../../node_modules/pino-pretty')

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
