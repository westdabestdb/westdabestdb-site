import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Container, Footer, HomeLink } from '@/components'
import { PostList, resolveTagParam, tagFeedPath, tagPath } from '@/components/writing'
import { getPostsByTag, getSite, getTags } from '@/lib/content'

type TagPageProps = { params: Promise<{ tag: string }> }

export function generateStaticParams() {
  // Raw tags. Next percent-encodes them into the path, so "brain dump"
  // becomes /tags/brain%20dump; `resolveTagParam` reads either form back.
  return getTags().map(({ tag }) => ({ tag }))
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const name = resolveTagParam(tag)
  if (!name) return {}

  const site = getSite()

  const title = `${name} · ${site.name}`

  return {
    title: { absolute: title },
    alternates: {
      canonical: tagPath(name),
      types: { 'application/rss+xml': tagFeedPath(name) },
    },
    openGraph: { url: tagPath(name), title },
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params
  const name = resolveTagParam(tag)
  if (!name) notFound()

  const posts = getPostsByTag(name)

  return (
    <main>
      <Container sub>
        <HomeLink />
        <div className="blk">
          <h1 className="name">{name}</h1>
          <PostList posts={posts} />
        </div>
        <Footer />
      </Container>
    </main>
  )
}
