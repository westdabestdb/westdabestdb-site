import Link from 'next/link'
import type { ReactNode } from 'react'

/** Second grey line under a row: bold role, then dot-separated details. */
export type RowMeta = {
  role: string
  items?: (string | undefined | null | false)[]
}

export type RowProps = {
  title: string
  /** Omit for a project with no live page: the row renders as plain text. */
  href?: string
  /** Grey trailing text. One ellipsised line on desktop, wraps under 640px. */
  description?: string
  /** Right-hand column: "2024–", "Feb 2025". Tabular figures. */
  year?: string
  /** Position in the date-ascending list. Rendered as "010", hidden under 640px. */
  number?: number
  /** Present → the row becomes the two-line `.item.stack` variant. */
  meta?: RowMeta
  /**
   * A 640×400 image under `/static/images/previews/`. Sets `data-preview`,
   * which is all `components/fx/HoverPreview.tsx` needs — the row itself stays
   * a server component and ships no JS.
   */
  preview?: string
}

/** Anything next/link should not own: another origin, a mail client, a file. */
const FILE_EXTENSIONS = ['.xml', '.txt', '.json', '.pdf']

function isPlainAnchor(href: string): boolean {
  if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) return true
  const [path = ''] = href.split(/[?#]/)
  return FILE_EXTENSIONS.some((ext) => path.endsWith(ext))
}

function isExternal(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')
}

function formatRowNumber(n: number): string {
  return String(n).padStart(3, '0')
}

function metaLine({ role, items }: RowMeta): ReactNode {
  const rest = (items ?? []).filter((item): item is string => Boolean(item))
  return (
    <span className="meta">
      <b>{role}</b>
      {rest.length > 0 ? ` · ${rest.join(' · ')}` : null}
    </span>
  )
}

/** A single list row. Wrap in `<List>` (`ul.list`). */
export function Row({ title, href, description, year, number, meta, preview }: RowProps) {
  const line = (
    <>
      {typeof number === 'number' ? <span className="n">{formatRowNumber(number)}</span> : null}
      <span className="t">{title}</span>
      <span className="d">{description}</span>
      {year ? <span className="y">{year}</span> : null}
    </>
  )

  const inner = meta ? (
    <>
      <span className="top">{line}</span>
      {metaLine(meta)}
    </>
  ) : (
    line
  )

  const className = meta ? 'item stack' : 'item'
  const hover = preview ? { 'data-preview': preview } : {}

  if (!href) {
    return (
      <li>
        <span className={`${className} item--static`} {...hover}>
          {inner}
        </span>
      </li>
    )
  }

  if (isPlainAnchor(href)) {
    // Route handlers and static files are not app routes, so next/link would
    // only prefetch a page that does not exist.
    const away = isExternal(href) ? { target: '_blank', rel: 'noreferrer' } : {}
    return (
      <li>
        <a className={className} href={href} {...away} {...hover}>
          {inner}
        </a>
      </li>
    )
  }

  return (
    <li>
      <Link className={className} href={href} {...hover}>
        {inner}
      </Link>
    </li>
  )
}

export type ListProps = { children: ReactNode }

/** `ul.list` — 6px between rows, 16px under 640px. */
export function List({ children }: ListProps) {
  return <ul className="list">{children}</ul>
}

export default Row
