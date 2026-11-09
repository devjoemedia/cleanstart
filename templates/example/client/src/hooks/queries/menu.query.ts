/**
 * Reads the menu from the mock-data seam.
 * @author {{author}}
 */
import { queryOptions, useQuery } from '@tanstack/react-query'
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from '#/constants'
import { getMenu } from '#/data/menu'
import { withErrorHandling } from '#/lib/errors'

export const menuKeys = {
  all: ['menu'] as const,
  list: (category?: string) => [...menuKeys.all, 'list', category] as const,
}

const fetchMenu = withErrorHandling(async (category?: string) => {
  await new Promise((resolve) => setTimeout(resolve, 300)) // simulate latency
  return getMenu(category) // swap for httpClient.get<Array<MenuItem>>('/menu') when the API is live
}, 'Failed to load the menu')

export const menuQueryOptions = (category?: string) =>
  queryOptions({
    queryKey: menuKeys.list(category),
    queryFn: () => fetchMenu(category),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  })

export const useMenuQuery = (category?: string) => useQuery(menuQueryOptions(category))
