import type { RequestHandler } from 'express'
import { NotFoundError } from '#/lib/errors{{ext}}'

// Runs after every router, so it only sees requests nothing else answered.
export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`No route for ${req.method} ${req.path}`))
}
