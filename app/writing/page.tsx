import type { Metadata } from 'next'

import { Container, Footer, HomeLink } from '@/components'
import { PostList } from '@/components/writing'
import { getPosts, getSite } from '@/lib/content'

export function generateMetadata(): Metadata {
  const site = getSite()

  const title = `Writing · ${site.name}`

  return {
    title: { absolute: title },
    alternates: {
      canonical: '/writing',
      types: { 'application/rss+xml': '/feed.xml' },
    },
    openGraph: { url: '/writing', title },
  }
}

export default function WritingPage() {
  const posts = getPosts()

  return (
    <main>
      <Container sub>
        <HomeLink />
        <div className="blk">
          <h1 className="name">Writing</h1>
          <PostList posts={posts} />
        </div>
        <Footer />
      </Container>
    </main>
  )
}
