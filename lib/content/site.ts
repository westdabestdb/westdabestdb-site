import { site as raw } from '@/content/site'

import { siteSchema, type Site } from './schemas'

let cache: Site | null = null

/** Validated `content/site.ts`. Throws on a malformed value. */
export function getSite(): Site {
  if (cache) return cache

  const result = siteSchema.safeParse(raw)
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid content/site.ts:\n${detail}`)
  }

  cache = result.data
  return cache
}
