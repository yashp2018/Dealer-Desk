// pino-http assigns a string request id to req.id; declare it so TS across
// the codebase (error handler, audit logger) can reference req.id safely.
import 'express'

declare module 'express-serve-static-core' {
  interface Request {
    id?: string | number
  }
}
