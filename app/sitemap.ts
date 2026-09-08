import type { MetadataRoute } from 'next'

import { tagPath } from '@/components/writing'
import { getPosts, getSite, getTags } from '@/lib/content'
import { toDate } from '@/lib/format'

const STATIC_ROUTES = ['', '/work', '/writing', '/tags'] as const

/** Plain-text and JSON endpoints, listed so agents can find them. */
const AGENT_ROUTES = ['/llms.txt', '/api/site.json'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSite()
  const base = site.siteUrl.replace(/\/$/, '')
  const posts = getPosts()
  const newest = posts[0] ? toDate(posts[0].date) : new Date()

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${base}${route || '/'}`,
      lastModified: newest,
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1 : 0.7,
    })),
    ...AGENT_ROUTES.map((route) => ({
      url: `${base}${route}`,
      lastModified: newest,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
    ...posts.map((post) => ({
      url: `${base}${post.url}`,
      lastModified: toDate(post.date),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
    ...getTags().map(({ tag }) => ({
      url: `${base}${tagPath(tag)}`,
      lastModified: newest,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ]
}
