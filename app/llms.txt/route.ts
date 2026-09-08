import { buildSummary } from '@/lib/agent-summary'
import { formatMonth } from '@/lib/format'

export const dynamic = 'force-static'

export function GET(): Response {
  const s = buildSummary()

  const lines: string[] = [
    `# ${s.name}`,
    '',
    s.bio,
    '',
    `Title: ${s.title}`,
    `Location: ${s.location}`,
    `Site: ${s.links['site']}`,
    '',
    '## Work',
    '',
    ...s.work.map((project) => {
      const details = [
        project.role,
        project.stack.join(', '),
        project.proof,
        project.own ? 'on my own' : 'with a team',
        project.status,
      ].filter((part): part is string => Boolean(part))

      return `- ${project.name} — ${project.year} — ${project.description} — ${details.join(' — ')}${project.link ? ` — ${project.link}` : ''}`
    }),
    '',
    '## Writing',
    '',
    ...s.writing.map((post) => `- ${post.title} — ${post.date} — ${post.url} — ${post.summary}`),
    '',
    '## Experience',
    '',
    ...s.experience.map((role) => {
      const span = `${formatMonth(role.start)} – ${role.end ? formatMonth(role.end) : 'present'}`
      const details = [role.location, role.stack.join(', ')].filter(Boolean)

      return `- ${role.company} — ${role.role} — ${span}${details.length ? ` — ${details.join(' — ')}` : ''}`
    }),
    '',
    '## Side projects',
    '',
    ...s.sideProjects.map((project) => {
      const links = project.links.map((link) => link.href).join(' ')

      return `- ${project.name} — ${project.description}${links ? ` — ${links}` : ''}`
    }),
    '',
    '## Education',
    '',
    ...s.education.map((entry) => `- ${entry.school} — ${entry.degree} — ${entry.years}`),
    '',
    '## Links',
    '',
    ...Object.entries(s.links).map(([label, href]) => `- ${label}: ${href}`),
    '',
    `Generated ${s.generatedAt}.`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
