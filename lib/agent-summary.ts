import { getCv, getPosts, getProjects, getSite } from '@/lib/content'

/** One project, flattened for machines. */
export type SummaryWork = {
  name: string
  description: string
  year: string
  role: string
  stack: string[]
  proof: string | null
  link: string | null
  own: boolean
  status: string
}

export type SummaryPost = {
  title: string
  date: string
  summary: string
  /** Absolute. */
  url: string
}

export type SummaryRole = {
  company: string
  role: string
  /** "YYYY-MM". */
  start: string
  /** "YYYY-MM", or `null` while it is still current. */
  end: string | null
  location: string
  stack: string[]
}

export type SummarySideProject = {
  name: string
  description: string
  links: { label: string; href: string }[]
}

export type SummaryEducation = {
  school: string
  degree: string
  years: string
}

export type AgentSummary = {
  name: string
  title: string
  location: string
  /** The home-page bio with its links flattened to plain text. */
  bio: string
  work: SummaryWork[]
  writing: SummaryPost[]
  experience: SummaryRole[]
  sideProjects: SummarySideProject[]
  education: SummaryEducation[]
  links: Record<string, string>
  /** ISO timestamp. These routes are static, so this is the build time. */
  generatedAt: string
}

/**
 * Everything the site knows about, in one plain object. Backs `/llms.txt`
 * and `/api/site.json` so both always say the same thing.
 */
export function buildSummary(): AgentSummary {
  const site = getSite()
  const projects = getProjects()
  const posts = getPosts()
  const cv = getCv()

  const base = site.siteUrl.replace(/\/$/, '')

  return {
    name: site.name,
    title: site.title,
    location: site.location,
    bio: site.bio
      .map((segment) => segment.text)
      .join('')
      .replace(/\s+/g, ' ')
      .trim(),
    work: projects.map((project) => ({
      name: project.name,
      description: project.description,
      year: project.year,
      role: project.role,
      stack: project.stack,
      proof: project.proof ?? null,
      link: project.link ?? null,
      own: project.own,
      status: project.status,
    })),
    writing: posts.map((post) => ({
      title: post.title,
      date: post.date,
      summary: post.summary,
      url: `${base}${post.url}`,
    })),
    experience: cv.experience.map((role) => ({
      company: role.company,
      role: role.role,
      start: role.start,
      end: role.end,
      location: role.location,
      stack: role.stack,
    })),
    sideProjects: cv.sideProjects.map((project) => ({
      name: project.name,
      description: project.description,
      links: project.links.map((link) => ({ label: link.label, href: link.href })),
    })),
    education: cv.education.map((entry) => ({
      school: entry.school,
      degree: entry.degree,
      years: entry.years,
    })),
    links: {
      site: base,
      github: site.github,
      linkedin: site.linkedin,
      email: `mailto:${site.email}`,
      repo: `https://github.com/${site.repo}`,
      resume: `${base}/resume.pdf`,
      rss: `${base}/feed.xml`,
      llms: `${base}/llms.txt`,
      json: `${base}/api/site.json`,
      sitemap: `${base}/sitemap.xml`,
    },
    generatedAt: new Date().toISOString(),
  }
}
