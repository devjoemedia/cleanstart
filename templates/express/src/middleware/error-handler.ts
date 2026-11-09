/**
 * The last middleware: every thrown or forwarded error leaves the API in the same JSON shape.
 * @author {{author}}
 */
import type { ErrorRequestHandler } from 'express'
import { AppError } from '#/lib/errors{{ext}}'
import type { ApiError } from '#/types{{#esm}}/index.js{{/esm}}'

// Express only treats a middleware as an error handler when it takes all four arguments.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // Body-parser errors (bad JSON, too large) carry their own 4xx status.
  const status = error instanceof AppError ? error.status : typeof error?.status === 'number' ? error.status : 500
  if (status >= 500) console.error(error)

  const body: ApiError = {
    error: {
      status,
      message: status >= 500 ? 'Something went wrong on our side.' : error.message,
      ...(error instanceof AppError && error.details ? { details: error.details } : {}),
    },
  }
  res.status(status).json(body)
}
