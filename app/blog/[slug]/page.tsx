import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'

import { Container, Footer, HomeLink, Prose } from '@/components'
import { PostHeader, PostNav } from '@/components/writing'
import { getPost, getPosts, getSite } from '@/lib/content'
import { truncate } from '@/lib/format'
import { Mdx } from '@/lib/mdx'

type PostPageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post || post.draft) return {}

  const site = getSite()
  const base = site.siteUrl.replace(/\/$/, '')
  const url = `${base}${post.url}`
  const title = `${post.title} · ${site.name}`
  const image = `/og/${post.slug}`
  // Search engines and cards cut a description around 160 characters; do it
  // here, on a word, rather than letting them do it mid-word.
  const description = truncate(post.summary)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: post.date,
      tags: post.tags,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post || post.draft) notFound()

  // Published posts, newest first — so the entry before this one is the newer.
  const posts = getPosts()
  const index = posts.findIndex((entry) => entry.slug === post.slug)
  const newer = index > 0 ? posts[index - 1] : undefined
  const older = index >= 0 ? posts[index + 1] : undefined

  // No accent → no inline value, so `.post-accent` falls back to `--a: var(--p)`.
  const accent = post.accent ? ({ '--a': post.accent } as CSSProperties) : undefined

  return (
    <main className="post-accent" style={accent}>
      <Container variant="post">
        <HomeLink />
        <PostHeader post={post} />
        <Prose>
          <Mdx source={post.body} />
        </Prose>
        <PostNav next={newer} previous={older} />
        <Footer />
      </Container>
    </main>
  )
}
