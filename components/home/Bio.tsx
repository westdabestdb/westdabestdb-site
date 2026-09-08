import Link from 'next/link'
import { Fragment } from 'react'

import type { BioSegment } from '@/lib/content'

export type BioProps = {
  /** Runs of the bio sentence from `content/site.ts`. `href` makes a link. */
  segments: BioSegment[]
}

function isInternal(href: string): boolean {
  return href.startsWith('/') || href.startsWith('#')
}

/**
 * The 24px/600 bio sentence. Hovering one link dims the rest — that is pure
 * CSS (`p.bio:has(a:hover)` in `app/globals.css`), nothing to wire up here.
 */
export function Bio({ segments }: BioProps) {
  return (
    <p className="bio">
      {segments.map((segment, index) => {
        if (!segment.href) return <Fragment key={index}>{segment.text}</Fragment>

        return isInternal(segment.href) ? (
          <Link key={index} href={segment.href}>
            {segment.text}
          </Link>
        ) : (
          <a key={index} href={segment.href} target="_blank" rel="noreferrer">
            {segment.text}
          </a>
        )
      })}
    </p>
  )
}

export default Bio
