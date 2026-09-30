import type { HomeContent } from '#/types'

// Plain serialisable values only, so this module can become a CMS query later.
export const homeContent: HomeContent = {
  hero: {
    title: 'Coffee worth crossing the road for.',
    body: 'Sit in, or order ahead and pick up at the counter.',
    cta: { label: 'See the menu', href: '/menu' },
  },
  steps: [
    { id: 'order', order: 1, title: 'Order ahead', icon: 'coffee' },
    { id: 'collect', order: 2, title: 'Collect at the counter', icon: 'gift' },
  ],
}
