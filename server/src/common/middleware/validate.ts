import { NextFunction, Request, Response } from 'express'
import { AnyZodObject, ZodError } from 'zod'
import { ValidationError } from '../errors/AppError'

interface Schemas {
  body?: AnyZodObject
  query?: AnyZodObject
  params?: AnyZodObject
}

function zodErrorToFieldErrors(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_'
    out[key] = out[key] ?? []
    out[key].push(issue.message)
  }
  return out
}

/** Validates and replaces req.body/query/params with the parsed (typed, coerced) result. */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body)
      if (schemas.query) req.query = schemas.query.parse(req.query) as never
      if (schemas.params) req.params = schemas.params.parse(req.params) as never
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError(zodErrorToFieldErrors(err)))
        return
      }
      next(err)
    }
  }
}
