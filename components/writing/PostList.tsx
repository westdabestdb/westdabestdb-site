import { List, Row } from '@/components'
import type { Post } from '@/lib/content'
import { formatMonthYear } from '@/lib/format'

export type PostListProps = {
  /** Newest first. Each post carries its own date-ascending `number`. */
  posts: Post[]
}

/**
 * The writing list exactly as the mockup's Writing block: number, title and
 * the month-year at the end. No summaries, no tags.
 */
export function PostList({ posts }: PostListProps) {
  return (
    <List>
      {posts.map((post) => (
        <Row
          key={post.slug}
          title={post.title}
          href={post.url}
          number={post.number}
          year={formatMonthYear(post.date)}
        />
      ))}
    </List>
  )
}

export default PostList
