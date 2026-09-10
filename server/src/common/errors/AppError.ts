export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly errors?: Record<string, string[]>
  readonly isOperational = true

  constructor(message: string, statusCode: number, code: string, errors?: Record<string, string[]>) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.errors = errors
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace?.(this, this.constructor)
  }

  // ─── Static factory methods ───────────────────────────────────────────────

  static badRequest(message = 'Bad request', errors?: Record<string, string[]>): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', errors)
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED')
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(message, 403, 'FORBIDDEN')
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND')
  }

  static conflict(message = 'Conflict with current state'): AppError {
    return new AppError(message, 409, 'CONFLICT')
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS')
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors?: Record<string, string[]>) {
    super(message, 400, 'BAD_REQUEST', errors)
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string[]>, message = 'Validation failed') {
    super(message, 422, 'VALIDATION_ERROR', errors)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict with current state') {
    super(message, 409, 'CONFLICT')
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS')
  }
}

export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string, entity = 'record') {
    super(`Cannot move ${entity} from "${from}" to "${to}"`, 409, 'INVALID_TRANSITION')
  }
}
