import type { Metadata } from 'next'

import { Container, HomeLink } from '@/components'
import { getSite } from '@/lib/content'

export const metadata: Metadata = { title: 'Nothing here' }

export default function NotFound() {
  const site = getSite()

  return (
    <main>
      <Container>
        <HomeLink />
        <div className="blk">
          <h1 className="name">{site.name}</h1>
          <p className="bio">Nothing here.</p>
        </div>
      </Container>
    </main>
  )
}
