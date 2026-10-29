import { QueryClient } from '@tanstack/react-query'
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from '#/constants'

// One client for the app's lifetime; import it where code outside React needs the cache.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: DEFAULT_STALE_TIME, gcTime: DEFAULT_GC_TIME } },
})
