import { CopyEmail } from './CopyEmail'
import { ThemeToggle } from './ThemeToggle'
import { SoundToggle } from './fx/Sounds'
import { getSite } from '@/lib/content'

/** One 16px grey row: Copy email · CV · theme toggle · sound toggle. No rules,
    no chrome. "CV" is the PDF itself — there is no /cv page. */
export function Footer() {
  const site = getSite()

  return (
    <footer className="foot">
      <div className="links">
        <CopyEmail email={site.email} />
        <a href="/resume.pdf" target="_blank" rel="noreferrer">
          CV
        </a>
        <ThemeToggle />
        <SoundToggle />
      </div>
    </footer>
  )
}

export default Footer
