import type { MenuItem } from '#/types'

// Mock records behind the data seam; hooks read these until the real API exists.
const MENU: Array<MenuItem> = [
  {
    id: 'm1',
    slug: 'flat-white',
    name: 'Flat white',
    description: 'Double ristretto, steamed milk.',
    price: 3.4,
    category: 'coffee',
    available: true,
  },
  {
    id: 'm2',
    slug: 'iced-matcha',
    name: 'Iced matcha',
    description: 'Ceremonial matcha over oat milk and ice.',
    price: 4.2,
    category: 'matcha',
    available: true,
  },
  {
    id: 'm3',
    slug: 'grilled-halloumi',
    name: 'Grilled halloumi',
    description: 'Flatbread, harissa yoghurt, pickled onion.',
    price: 7.5,
    category: 'grill',
    available: false,
  },
]

export const getMenu = (category?: string) => (category ? MENU.filter((m) => m.category === category) : MENU)

export const getMenuItemBySlug = (slug: string) => MENU.find((m) => m.slug === slug)
