import matter from 'gray-matter'

import { listContentFiles, parseOrThrow, readContentFile, slugOf } from './fs'
import { projectFrontmatterSchema, type Project } from './schemas'

let cache: Project[] | null = null

const LAST = Number.MAX_SAFE_INTEGER
/** An open-ended year ("2025–") sorts above every finished one. */
const ONGOING = 9999

/** `"2024–2025"` → [2024, 2025]; `"2025–"` → [2025, ONGOING]; `"2019"` → [2019, 2019]. */
function span(year: string): [number, number] {
  const [start, end] = year.split('\u2013')
  const from = Number(start)
  const to = end === undefined ? from : end === '' ? ONGOING : Number(end)
  return [from, to]
}

/**
 * Every project in reverse chronological order: most recent activity first
 * (ongoing work on top), then most recent start, then `order` as a tie-break
 * for projects that share both years, then name.
 */
export function getProjects(): Project[] {
  if (cache) return cache

  const files = listContentFiles('projects', ['.md', '.mdx'])

  cache = files
    .map((file) => {
      const raw = readContentFile('projects', file)
      const { data, content } = matter(raw)
      const frontmatter = parseOrThrow(projectFrontmatterSchema, data, `projects/${file}`)

      return {
        ...frontmatter,
        slug: slugOf(file),
        body: content.trim(),
      }
    })
    .sort((a, b) => {
      const [aStart, aEnd] = span(a.year)
      const [bStart, bEnd] = span(b.year)
      return (
        bEnd - aEnd ||
        bStart - aStart ||
        (a.order ?? LAST) - (b.order ?? LAST) ||
        a.name.localeCompare(b.name)
      )
    })

  return cache
}

/** `featured: true`, for the Work block on the home page. */
export function getFeaturedProjects(): Project[] {
  return getProjects().filter((project) => project.featured)
}

/** `lab: true`, for the "Side projects" block on the home page. */
export function getLabProjects(): Project[] {
  return getProjects().filter((project) => project.lab)
}
