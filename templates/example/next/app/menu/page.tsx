import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { MenuList } from '#/components/menu/menu-list'
import { menuContent } from '#/content/menu'
import { menuQueryOptions } from '#/hooks/queries/menu.query'
import { getQueryClient } from '#/integrations/tanstack-query/get-query-client'
import { seo } from '#/lib/seo'

export const metadata = seo({ ...menuContent.seo, path: '/menu' })

// Prefetch on the server so the list renders with data and doesn't flash on load.
export default async function MenuPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(menuQueryOptions())

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{menuContent.title}</h1>
      <p className="mt-2 mb-8 text-muted-foreground">{menuContent.intro}</p>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MenuList />
      </HydrationBoundary>
    </main>
  )
}
