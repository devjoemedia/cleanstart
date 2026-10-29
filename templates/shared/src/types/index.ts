// Single source of truth for every shape in the app: data, content and SEO.

export interface Cta {
  label: string
  href: string
}

export type IconName = 'coffee' | 'gift' | 'utensils' | 'arrow-right' | 'alert'

export interface Step {
  id: string
  order: number
  title: string
  icon: IconName
}

export interface HeroBlock {
  title: string
  body: string
  cta: Cta
}

export interface HomeContent {
  hero: HeroBlock
  steps: Array<Step>
}

export interface PageSeo {
  title: string
  description: string
}

export interface MenuContent {
  seo: PageSeo
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

export interface SeoInput {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
}
