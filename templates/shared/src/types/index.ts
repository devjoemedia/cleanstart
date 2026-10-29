// Single source of truth for every shape in the app: data and content{{#web}}, plus SEO{{/web}}.

// Content names icons by key; components/common/icon.tsx maps each key to a glyph.
export type IconName = 'arrow-right' | 'alert'
{{#web}}

export interface PageSeo {
  title: string
  description: string
}

export interface SeoInput {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
}
{{/web}}
{{#example}}

export interface MenuContent {
{{#web}}
  seo: PageSeo
{{/web}}
  title: string
  intro: string
  loading: string
  empty: string
  error: string
  retry: string
  unavailable: string
}

export interface MenuItem {
  id: string
  slug: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
  image?: string
}
{{/example}}
