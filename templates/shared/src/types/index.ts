// Single source of truth for every shape in the app: data{{#client}} and content{{/client}}{{#web}}, plus SEO{{/web}}{{#server}}, plus the API's error body{{/server}}.
{{#client}}

// Content names icons by key; components/common/icon.tsx maps each key to a glyph.
export type IconName = 'arrow-right' | 'alert'
{{/client}}
{{#server}}

// Every error response has this body, whatever went wrong.
export interface ApiError {
  error: {
    status: number
    message: string
    details?: Array<string>
  }
}
{{/server}}
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
{{#client}}

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
{{/client}}

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
