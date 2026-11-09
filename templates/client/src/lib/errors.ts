/**
 * Turns any thrown value into a message that is safe to show a user.
 * @author {{author}}
 */
import { isNetworkError, isTimeoutError } from '#/lib/http-client'

export function sanitizeError(error: unknown, fallback: string): Error {
  const err = error instanceof Error ? error : new Error(fallback)
  if (isTimeoutError(err)) err.message = 'The request took too long. Please try again.'
  else if (isNetworkError(err)) err.message = 'Unable to reach the server. Please try again later.'
  else err.message = (err as { data?: { message?: string } }).data?.message || err.message || fallback
  return err
}

export const withErrorHandling =
  <TArgs extends Array<unknown>, TResult>(fn: (...args: TArgs) => Promise<TResult>, fallback: string) =>
  async (...input: TArgs): Promise<TResult> => {
    try {
      return await fn(...input)
    } catch (error) {
      throw sanitizeError(error, fallback)
    }
  }
