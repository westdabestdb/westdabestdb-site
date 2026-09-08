import { getPosts, getSite } from '@/lib/content'
import { escapeXml, rfc822 } from '@/lib/format'

export const dynamic = 'force-static'

export function GET(): Response {
  const site = getSite()
  const posts = getPosts()
  const base = site.siteUrl.replace(/\/$/, '')
  const description = `${site.title} in ${site.location}.`
  const updated = posts[0] ? rfc822(posts[0].date) : new Date().toUTCString()

  const items = posts
    .map((post) => {
      const url = `${base}${post.url}`
      const categories = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join('\n')

      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${rfc822(post.date)}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        categories,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(site.name)}</title>`,
    `    <link>${escapeXml(base)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${updated}</lastBuildDate>`,
    `    <managingEditor>${escapeXml(`${site.email} (${site.name})`)}</managingEditor>`,
    `    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
