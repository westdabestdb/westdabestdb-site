import type { SiteInput } from '@/lib/content/schemas'

export const site: SiteInput = {
  name: 'Görkem Erol',
  title: 'Orchestrator of agents',
  location: 'Istanbul',
  email: 'westdabestdb@gmail.com',
  github: 'https://github.com/westdabestdb',
  linkedin: 'https://www.linkedin.com/in/westdabestdb',
  siteUrl: 'https://westdabestdb.com',
  repo: 'westdabestdb/westdabestdb-site',
  bio: [
    { text: 'I orchestrate agents that build apps. Currently at ' },
    { text: 'Flovi', href: 'https://flovi.io/es' },
    { text: ', co-founder of ' },
    { text: 'Charles', href: 'https://getcharles.pro' },
    { text: '. Earlier, ' },
    { text: '4Human', href: 'https://4human.no/en/4human-hrm-mobilapplikasjon/' },
    { text: ' and ' },
    { text: 'Blocklords', href: 'https://blocklords.com/' },
    { text: '.' },
  ],
  social: [
    { label: 'GitHub', href: 'https://github.com/westdabestdb' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/westdabestdb' },
    { label: 'Email', href: 'mailto:westdabestdb@gmail.com' },
    { label: 'CV', href: '/resume.pdf' },
  ],
  stack: [
    'Flutter',
    'Swift',
    'SwiftUI',
    'Nest.js',
    'Laravel',
    'Postgres',
    'Next.js',
    'Claude Code',
    'Web3',
  ],
  workIntro: 'Nine years of shipping apps.',
}

export default site
