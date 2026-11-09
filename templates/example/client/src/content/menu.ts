import type { MenuContent } from '#/types'

export const menuContent: MenuContent = {
{{#web}}
  seo: {
    title: 'Menu',
    description: 'Everything we pour and grill.',
  },
{{/web}}
  title: 'Menu',
  intro: 'Everything we pour and grill, made to order.',
  loading: 'Loading the menu…',
  empty: 'Nothing on the menu right now. Check back soon.',
  error: 'We couldn’t load the menu.',
  retry: 'Try again',
  unavailable: 'Sold out',
}
