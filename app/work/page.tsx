import type { Metadata } from 'next'

import { Container, Footer, HomeLink, List, Row, Section } from '@/components'
import { WORK_GROUPS } from '@/components/work/groups'
import { WorkFilter } from '@/components/work/WorkFilter'
import { getProjects, getSite } from '@/lib/content'
import type { Project } from '@/lib/content'

const [TEAMS, OWN] = WORK_GROUPS

export function generateMetadata(): Metadata {
  const site = getSite()
  const title = `Work · ${site.name}`

  return {
    title: { absolute: title },
    description: site.workIntro,
    alternates: { canonical: '/work' },
    openGraph: { url: '/work', title, description: site.workIntro },
  }
}

/** `Senior engineer · Flutter · Laravel · sole engineer on a country expansion` */
function rowsFor(projects: Project[]) {
  return projects.map((project) => (
    <Row
      key={project.slug}
      title={project.name}
      href={project.link}
      description={project.description}
      year={project.year}
      preview={project.preview}
      meta={{ role: project.role, items: [...project.stack, project.proof] }}
    />
  ))
}

export default function Work() {
  const site = getSite()
  const projects = getProjects()
  const withTeams = projects.filter((project) => !project.own)
  const onMyOwn = projects.filter((project) => project.own)

  return (
    <main>
      <Container sub>
        <HomeLink />
        <div className="blk">
          <h1 className="name">Work</h1>
          <p className="work-intro">{site.workIntro}</p>
          <p className="stackline">
            <b>Stack</b> {site.stack.join(' · ')}
          </p>
          <WorkFilter />
        </div>

        <Section id={TEAMS.id} dataGroup={TEAMS.group} label="With teams">
          <List>{rowsFor(withTeams)}</List>
        </Section>

        <Section id={OWN.id} dataGroup={OWN.group} label="On my own">
          <List>{rowsFor(onMyOwn)}</List>
        </Section>

        <Footer />
      </Container>
    </main>
  )
}
