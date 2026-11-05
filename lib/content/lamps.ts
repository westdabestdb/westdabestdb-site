import matter from 'gray-matter'

import { contentFileExists, parseOrThrow, readContentFile } from './fs'
import {
  lampsDocFrontmatterSchema,
  lampsLangSchema,
  lampsPageNameSchema,
  type LampsDoc,
  type LampsPageName,
} from './schemas'

const URLS: Record<LampsPageName, string> = {
  support: '/lamps',
  privacy: '/lamps/privacy',
}

const cache = new Map<LampsPageName, LampsDoc[]>()

/**
 * Both language versions of a page of the Lamps app's site, Turkish first,
 * from `content/lamps/<page>.<lang>.mdx`. A missing or malformed file fails
 * the build: the App Store links to these pages.
 */
export function getLampsPage(page: LampsPageName): LampsDoc[] {
  const cached = cache.get(page)
  if (cached) return cached

  const docs = lampsLangSchema.options.map((lang): LampsDoc => {
    const file = `${page}.${lang}.mdx`
    if (!contentFileExists('lamps', file)) {
      throw new Error(`Missing content/lamps/${file}`)
    }
    const { data, content } = matter(readContentFile('lamps', file))
    const frontmatter = parseOrThrow(lampsDocFrontmatterSchema, data, `lamps/${file}`)
    return { ...frontmatter, page, lang, url: URLS[page], body: content }
  })

  cache.set(page, docs)
  return docs
}

/**
 * Every Lamps page's URL, support first, for the sitemap. `date` is the newer
 * of its two languages' dates.
 */
export function getLampsRoutes(): { url: string; date: string }[] {
  return lampsPageNameSchema.options.map((page) => {
    const dates = getLampsPage(page).map((doc) => doc.date)
    return { url: URLS[page], date: dates.reduce((a, b) => (a > b ? a : b)) }
  })
}
