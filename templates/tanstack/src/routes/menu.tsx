import { createFileRoute } from '@tanstack/react-router'
import { MenuList } from '#/components/menu/menu-list'
import { menuContent } from '#/content/menu'
import { menuQueryOptions } from '#/hooks/queries/menu.query'
import { seo } from '#/lib/seo'

export const Route = createFileRoute('/menu')({
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQueryOptions()),
  head: () => seo({ ...menuContent.seo, path: '/menu' }),
  component: MenuPage,
})

// The loader fills the cache first, so the page server-renders with the menu in place.
function MenuPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{menuContent.title}</h1>
      <p className="mt-2 mb-8 text-muted-foreground">{menuContent.intro}</p>
      <MenuList />
    </main>
  )
}
