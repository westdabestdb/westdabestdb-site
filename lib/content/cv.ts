import { contentFileExists, parseOrThrow, readContentFile } from './fs'
import { cvSchema, type Cv } from './schemas'

let cache: Cv | null = null

/** Throws when `content/cv.json` is missing — `/llms.txt` and `/api/site.json`
    read the experience, side projects and education from it. */
export function getCv(): Cv {
  if (cache) return cache

  if (!contentFileExists('cv.json')) {
    throw new Error('Missing content/cv.json')
  }

  cache = parseOrThrow(cvSchema, JSON.parse(readContentFile('cv.json')), 'cv.json')
  return cache
}
