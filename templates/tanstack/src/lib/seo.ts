/**
 * Builds a route's head (title, description, canonical, Open Graph, Twitter, robots).
 * @author {{author}}
 */
import { SITE } from '#/constants/site'
import type { SeoInput } from '#/types'

export function seo({ title, description, path = '/', image, noIndex }: SeoInput = {}) {
  const fullTitle = title ? `${title} — ${SITE.name}` : SITE.defaultTitle
  const summary = description ?? SITE.description
  const url = new URL(path, SITE.url).toString()
  const imageUrl = new URL(image ?? SITE.ogImage, SITE.url).toString()

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: summary },
      { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE.name },
      { property: 'og:locale', content: SITE.locale },
      { property: 'og:url', content: url },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: summary },
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: summary },
      { name: 'twitter:image', content: imageUrl },
      ...(SITE.twitter ? [{ name: 'twitter:creator', content: SITE.twitter }] : []),
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
