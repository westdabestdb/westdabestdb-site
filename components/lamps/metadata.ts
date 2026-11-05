import type { Metadata } from 'next'

import { getSite } from '@/lib/content'
import type { LampsDoc, LampsLang } from '@/lib/content'

const OG_LOCALES: Record<LampsLang, string> = { tr: 'tr_TR', en: 'en_US' }

/** The root layout's card image; restated because `openGraph` and `twitter`
 *  replace the layout's objects whole rather than merging into them. */
const IMAGE = '/og/home'

/**
 * `Lambalar Destek · Lamps Support · Görkem Erol`, both descriptions in page
 * order, and a canonical on the page's own URL. The Twitter card carries the
 * same title and description, or it would fall back to the home page's.
 */
export function lampsMetadata(docs: LampsDoc[]): Metadata {
  const [first, ...rest] = docs
  if (!first) return {}

  const site = getSite()
  const title = `${docs.map((doc) => doc.title).join(' · ')} · ${site.name}`
  const description = docs.map((doc) => doc.description).join(' ')

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: first.url },
    openGraph: {
      type: 'website',
      siteName: site.name,
      url: first.url,
      title,
      description,
      locale: OG_LOCALES[first.lang],
      alternateLocale: rest.map((doc) => OG_LOCALES[doc.lang]),
      images: [IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [IMAGE],
    },
  }
}
