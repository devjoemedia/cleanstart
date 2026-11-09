/**
 * Builds the Express app without listening, so tests can mount it directly.
 * @author {{author}}
 */
import express, { type Express } from 'express'
import { errorHandler } from '#/middleware/error-handler{{ext}}'
import { notFound } from '#/middleware/not-found{{ext}}'
import { router } from '#/routes/index{{ext}}'

export function createApp(): Express {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.use(router)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
