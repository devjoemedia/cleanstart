import { Suspense } from 'react'
import { MenuSection } from '#/components/menu/menu-section'
import { menuContent } from '#/content/menu'
import { seo } from '#/lib/seo'

export const metadata = seo({ ...menuContent.seo, path: '/menu' })

// The heading prerenders; the data-backed list streams in behind Suspense (required with cacheComponents).
export default function MenuPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{menuContent.title}</h1>
      <p className="mt-2 mb-8 text-muted-foreground">{menuContent.intro}</p>
      <Suspense fallback={<p role="status" className="text-muted-foreground">{menuContent.loading}</p>}>
        <MenuSection />
      </Suspense>
    </main>
  )
}
