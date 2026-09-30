import { QueryClient, isServer } from '@tanstack/react-query'
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from '#/constants'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: DEFAULT_STALE_TIME, gcTime: DEFAULT_GC_TIME } },
  })
}

let browserQueryClient: QueryClient | undefined

// A fresh client per server request; one shared client in the browser.
export function getQueryClient() {
  if (isServer) return makeQueryClient()
  return (browserQueryClient ??= makeQueryClient())
}
