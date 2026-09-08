import type { Metadata } from 'next'

import { Container, Footer, HomeLink, List, Row } from '@/components'
import { tagPath } from '@/components/writing'
import { getSite, getTags } from '@/lib/content'

export function generateMetadata(): Metadata {
  const site = getSite()

  const title = `Tags · ${site.name}`

  return {
    title: { absolute: title },
    alternates: { canonical: '/tags' },
    openGraph: { url: '/tags', title },
  }
}

export default function TagsPage() {
  const tags = getTags()

  return (
    <main>
      <Container sub>
        <HomeLink />
        <div className="blk">
          <h1 className="name">Tags</h1>
          <List>
            {tags.map(({ tag, count }) => (
              <Row
                key={tag}
                title={tag}
                href={tagPath(tag)}
                description={count === 1 ? '1 post' : `${count} posts`}
              />
            ))}
          </List>
        </div>
        <Footer />
      </Container>
    </main>
  )
}
