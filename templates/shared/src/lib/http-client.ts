/**
 * fetch wrapper with a timeout, retries with backoff and typed errors.
 * @author {{author}}
 */
import { API_URL } from '#/constants/env'

export class TimeoutError extends Error {
  readonly name = 'TimeoutError' as const
}

export class NetworkError extends Error {
  readonly name = 'NetworkError' as const
}

export class HttpError extends Error {
  readonly name = 'HttpError' as const
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`Request failed with status ${status}`)
  }
}

export const isTimeoutError = (error: unknown): error is TimeoutError => error instanceof TimeoutError
export const isNetworkError = (error: unknown): error is NetworkError => error instanceof NetworkError

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function request<T>(path: string, { timeout = 15_000, retries = 2, ...init }: RequestOptions = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init.headers },
        signal: controller.signal,
      })
      const data = response.status === 204 ? null : await response.json().catch(() => null)
      if (!response.ok) throw new HttpError(response.status, data)
      return data as T
    } catch (error) {
      const failure =
        error instanceof HttpError
          ? error
          : controller.signal.aborted
            ? new TimeoutError('Request timed out')
            : new NetworkError('Network request failed')
      // Only retry what might succeed next time: timeouts, network drops and 5xx responses.
      const retryable = !(failure instanceof HttpError) || failure.status >= 500
      if (!retryable || attempt >= retries) throw failure
      await sleep(300 * 2 ** attempt)
    } finally {
      clearTimeout(timer)
    }
  }
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}
