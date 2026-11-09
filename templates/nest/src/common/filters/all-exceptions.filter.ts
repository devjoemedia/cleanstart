/**
 * Sends every error in the same JSON shape and keeps server faults out of the response.
 * @author {{author}}
 */
import { Catch, HttpException, HttpStatus, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common'
import type { Response } from 'express'
import type { ApiError } from '#/types{{#esm}}/index.js{{/esm}}'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    if (status >= 500) this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : exception)

    const body: ApiError = { error: { status, ...describe(exception, status) } }
    host.switchToHttp().getResponse<Response>().status(status).json(body)
  }
}

// ValidationPipe puts one message per failed rule in an array; those become the details.
function describe(exception: unknown, status: number): { message: string; details?: Array<string> } {
  if (!(exception instanceof HttpException) || status >= 500) return { message: 'Something went wrong on our side.' }
  const response = exception.getResponse()
  const message = typeof response === 'string' ? response : (response as { message?: string | Array<string> }).message
  if (Array.isArray(message)) return { message: 'Validation failed', details: message }
  return { message: message ?? exception.message }
}
