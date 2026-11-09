/**
 * Errors the API means to send: each carries its HTTP status and a message that is safe to show.
 * @author {{author}}
 */
export class AppError extends Error {
  readonly status: number
  readonly details?: Array<string>

  constructor(status: number, message: string, details?: Array<string>) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message)
  }
}

export class ValidationError extends AppError {
  constructor(details: Array<string>) {
    super(400, 'Validation failed', details)
  }
}
