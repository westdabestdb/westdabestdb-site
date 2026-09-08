import type { Metadata } from 'next'

import { Avatar, Container, Footer, List, Row, Section } from '@/components'
import { Bio } from '@/components/home/Bio'
import { SocialLinks } from '@/components/home/SocialLinks'
import { getFeaturedProjects, getLabProjects, getPosts, getSite } from '@/lib/content'
import { formatMonthYear } from '@/lib/format'

const LATEST_POSTS = 5

export function generateMetadata(): Metadata {
  const site = getSite()

  const description = `${site.title}.`

  return {
    title: { absolute: site.name },
    description,
    alternates: { canonical: '/' },
    openGraph: { url: '/', title: site.name, description },
  }
}

export default function Home() {
  const site = getSite()
  const featured = getFeaturedProjects()
  const lab = getLabProjects()
  const posts = getPosts().slice(0, LATEST_POSTS)

  return (
    <main>
      <Container>
        <div className="blk">
          <Avatar />
          <h1 className="name">{site.name}</h1>
          <Bio segments={site.bio} />
        </div>

        <div className="blk">
          <SocialLinks links={site.social} />
        </div>

        <Section label="Work" href="/work">
          <List>
            {featured.map((project) => (
              <Row
                key={project.slug}
                title={project.name}
                href={project.link}
                description={project.description}
                year={project.year}
                preview={project.preview}
              />
            ))}
          </List>
        </Section>

        <Section label="Writing" href="/writing">
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
        </Section>

        <Section label="Side projects">
          <List>
            {lab.map((project) => (
              <Row
                key={project.slug}
                title={project.name}
                href={project.link}
                description={project.description}
                preview={project.preview}
              />
            ))}
          </List>
        </Section>

        <Footer />
      </Container>
    </main>
  )
}
