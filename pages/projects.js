import { getAllFilesFrontMatter } from '@/lib/mdx'
import siteMetadata from '@/data/siteMetadata'
import { PageSEO } from '@/components/SEO'
import ProjectsLayout from '@/layouts/ProjectsLayout'

export async function getStaticProps() {
  let projects = await getAllFilesFrontMatter('projects')
  let ownProjects = projects.filter((project) => project.own === true)

  let contributedProjects = projects.filter((project) => project.own !== true)

  return { props: { ownProjects, contributedProjects } }
}

export default function Projects({ ownProjects, contributedProjects }) {
  return (
    <>
      <PageSEO title={`Projects - ${siteMetadata.author}`} description={siteMetadata.description} />
      <ProjectsLayout
        ownProjects={ownProjects}
        contributedProjects={contributedProjects}
        title="Projects"
      />
    </>
  )
}
