import matter from 'gray-matter'
import readingTime from 'reading-time'

import { listContentFiles, parseOrThrow, readContentFile, slugOf } from './fs'
import { postFrontmatterSchema, type Post, type ReadingTime } from './schemas'

let cache: Post[] | null = null

function loadAll(): Post[] {
  if (cache) return cache

  const files = listContentFiles('posts', ['.mdx', '.md'])

  const parsed = files.map((file) => {
    const raw = readContentFile('posts', file)
    const { data, content } = matter(raw)
    const frontmatter = parseOrThrow(postFrontmatterSchema, data, `posts/${file}`)
    const stats = readingTime(content)
    const slug = slugOf(file)

    return {
      ...frontmatter,
      slug,
      url: `/blog/${slug}`,
      body: content,
      number: 0,
      readingTime: {
        text: stats.text,
        minutes: stats.minutes,
        words: stats.words,
      } satisfies ReadingTime,
    }
  })

  // Number = position in the date-ascending list, 1-based.
  const ascending = [...parsed].sort((a, b) => compareByDate(a, b))
  ascending.forEach((post, index) => {
    post.number = index + 1
  })

  cache = ascending.reverse()
  return cache
}

function compareByDate(a: { date: string; slug: string }, b: { date: string; slug: string }) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return a.slug < b.slug ? -1 : 1
}

/** Published posts, newest first. Drafts are never returned. */
export function getPosts(): Post[] {
  return loadAll().filter((post) => !post.draft)
}

/** Any post by slug, drafts included, or `undefined`. */
export function getPost(slug: string): Post | undefined {
  return loadAll().find((post) => post.slug === slug)
}

/** Every tag on a published post, with its post count, most used first. */
export function getTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const post of getPosts()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function getPostsByTag(tag: string): Post[] {
  const wanted = tag.toLowerCase()
  return getPosts().filter((post) => post.tags.some((t) => t.toLowerCase() === wanted))
}
