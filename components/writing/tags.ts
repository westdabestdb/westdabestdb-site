import { getTags } from '@/lib/content'

/**
 * Tags go into the URL raw and percent-encoded, so "brain dump" lives at
 * `/tags/brain%20dump`. This is the encoding `app/sitemap.ts` already uses,
 * which keeps one tag string across frontmatter, links, params and the feed.
 */
export function tagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}`
}

/** `/tags/<tag>/feed.xml` */
export function tagFeedPath(tag: string): string {
  return `${tagPath(tag)}/feed.xml`
}

/**
 * A `[tag]` route param resolved to the tag exactly as frontmatter writes it,
 * or `undefined` when no published post carries it — the 404 case.
 *
 * Next is not consistent about decoding: a request gives the param decoded
 * ("brain dump"), and so does a route handler, but a page being prerendered
 * from `generateStaticParams` still sees the encoded segment
 * ("brain%20dump"). Match both forms, case-insensitively.
 */
export function resolveTagParam(param: string): string | undefined {
  const wanted = new Set([param.toLowerCase()])
  try {
    wanted.add(decodeURIComponent(param).toLowerCase())
  } catch {
    // Malformed escape sequence; the raw form is all there is to match on.
  }

  return getTags().find((entry) => wanted.has(entry.tag.toLowerCase()))?.tag
}
