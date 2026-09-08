import { resolveTagParam, tagPath } from '@/components/writing'
import { getPostsByTag, getSite, getTags } from '@/lib/content'
import { escapeXml, rfc822 } from '@/lib/format'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return getTags().map(({ tag }) => ({ tag }))
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ tag: string }> }
): Promise<Response> {
  const { tag } = await ctx.params
  const name = resolveTagParam(tag)

  if (!name) {
    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const site = getSite()
  const posts = getPostsByTag(name)
  const base = site.siteUrl.replace(/\/$/, '')
  const tagUrl = `${base}${tagPath(name)}`
  const description = `Posts tagged "${name}" by ${site.name}.`
  const updated = posts[0] ? rfc822(posts[0].date) : new Date().toUTCString()

  const items = posts
    .map((post) => {
      const url = `${base}${post.url}`
      const categories = post.tags
        .map((entry) => `      <category>${escapeXml(entry)}</category>`)
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
    `    <title>${escapeXml(`${site.name} · ${name}`)}</title>`,
    `    <link>${escapeXml(tagUrl)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${updated}</lastBuildDate>`,
    `    <managingEditor>${escapeXml(`${site.email} (${site.name})`)}</managingEditor>`,
    `    <atom:link href="${escapeXml(`${tagUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
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
