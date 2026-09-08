import Link from 'next/link'

import type { Post } from '@/lib/content'

export type PostNavProps = {
  /** The newer post. Shown on the left as "Next". */
  next?: Post | undefined
  /** The older post. Shown on the right as "Previous". */
  previous?: Post | undefined
}

/** `.pnav` — label in `q`, title in `p` at 500. A missing side is omitted. */
export function PostNav({ next, previous }: PostNavProps) {
  if (!next && !previous) return null

  return (
    <nav className="pnav" aria-label="More posts">
      {next ? (
        <Link href={next.url}>
          <span>Next</span>
          <b>{next.title}</b>
        </Link>
      ) : null}
      {previous ? (
        <Link className="prev" href={previous.url}>
          <span>Previous</span>
          <b>{previous.title}</b>
        </Link>
      ) : null}
    </nav>
  )
}

export default PostNav
