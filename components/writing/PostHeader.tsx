import Link from 'next/link'
import { Fragment } from 'react'

import { tagPath } from './tags'
import type { Post } from '@/lib/content'
import { formatLongDate } from '@/lib/format'

export type PostHeaderProps = { post: Post }

/**
 * `.phead` — date (with the reading time in the same grey), title, then the
 * plain-text tag line. Tag colour comes from `.pill .tag`, or from the
 * per-post accent when the wrapper carries `--a`.
 */
export function PostHeader({ post }: PostHeaderProps) {
  const date = [formatLongDate(post.date), post.readingTime.text].filter(Boolean).join(' · ')

  return (
    <header className="phead">
      <p className="date">{date}</p>
      <h1>{post.title}</h1>
      {post.tags.length > 0 ? (
        <div className="pill">
          {post.tags.map((tag, index) => (
            <Fragment key={tag}>
              {index > 0 ? <span aria-hidden="true">·</span> : null}
              <Link className="tag" href={tagPath(tag)}>
                {tag}
              </Link>
            </Fragment>
          ))}
        </div>
      ) : null}
    </header>
  )
}

export default PostHeader
