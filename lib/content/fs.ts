import fs from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'

export const CONTENT_DIR = path.join(process.cwd(), 'content')

export function contentPath(...parts: string[]): string {
  return path.join(CONTENT_DIR, ...parts)
}

/** Files in `content/<dir>` with one of `exts`. Missing directory → `[]`. */
export function listContentFiles(dir: string, exts: readonly string[]): string[] {
  const abs = contentPath(dir)
  if (!fs.existsSync(abs)) return []
  return fs
    .readdirSync(abs)
    .filter((f) => !f.startsWith('.') && exts.some((ext) => f.endsWith(ext)))
    .sort()
}

export function readContentFile(...parts: string[]): string {
  return fs.readFileSync(contentPath(...parts), 'utf8')
}

export function contentFileExists(...parts: string[]): boolean {
  return fs.existsSync(contentPath(...parts))
}

export function slugOf(filename: string): string {
  return filename.replace(/\.(mdx|md|json)$/, '')
}

/**
 * Parse with zod, or throw with the offending file named. A malformed content
 * file must fail the build — never be silently skipped.
 */
export function parseOrThrow<S extends z.ZodType>(
  schema: S,
  value: unknown,
  file: string
): z.output<S> {
  const result = schema.safeParse(value)
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid content in content/${file}:\n${detail}`)
  }
  return result.data
}
