import type { MetadataRoute } from 'next'

import { getSite } from '@/lib/content'

export default function robots(): MetadataRoute.Robots {
  const base = getSite().siteUrl.replace(/\/$/, '')

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
