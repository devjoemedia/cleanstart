import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { MenuList } from '#/components/menu/menu-list'
import { menuQueryOptions } from '#/hooks/queries/menu.query'
import { getQueryClient } from '#/integrations/tanstack-query/get-query-client'

// Prefetch on the server so the list renders with data and doesn't flash on load.
export async function MenuSection() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(menuQueryOptions())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MenuList />
    </HydrationBoundary>
  )
}
