/**
 * Builds a page's Next.js metadata from the site defaults.
 * @author {{author}}
 */
import type { Metadata } from 'next'
import { SITE } from '#/constants/site'
import type { SeoInput } from '#/types'

export function seo({ title, description, path = '/', image, noIndex }: SeoInput = {}): Metadata {
  const fullTitle = title ? `${title} — ${SITE.name}` : SITE.defaultTitle
  const summary = description ?? SITE.description
  const url = new URL(path, SITE.url).toString()
  const images = [{ url: new URL(image ?? SITE.ogImage, SITE.url).toString() }]

  return {
    title: fullTitle,
    description: summary,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title: fullTitle, description: summary, siteName: SITE.name, locale: SITE.locale, images },
    twitter: { card: 'summary_large_image', title: fullTitle, description: summary, creator: SITE.twitter || undefined, images },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  }
}
