import type { ComponentProps } from 'react'

import { Container } from '../Container'
import { Footer } from '../Footer'
import { HomeLink } from '../HomeLink'
import { Prose } from '../Prose'
import type { LampsDoc, LampsLang } from '@/lib/content'
import { toDate } from '@/lib/format'
import { Mdx } from '@/lib/mdx'

export type LampsPageProps = {
  /** Both language versions of the page, in render order (Turkish first). */
  docs: LampsDoc[]
}

const DATE_LOCALES: Record<LampsLang, string> = { tr: 'tr-TR', en: 'en-US' }

/** "5 Kasım 2026" / "November 5, 2026". */
function formatDocDate(date: string, lang: LampsLang): string {
  return toDate(date).toLocaleDateString(DATE_LOCALES[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * MDX overrides for one language's half. Both halves are rendered on one
 * page, so rehype-slug would give "Bluetooth" the same id twice — the
 * heading ids get the language as a prefix ("tr-bluetooth", "en-bluetooth").
 * `<DocDate />` prints the frontmatter `date` in that language.
 */
function componentsFor(doc: LampsDoc) {
  function H2({ id, ...rest }: ComponentProps<'h2'>) {
    return <h2 id={id ? `${doc.lang}-${id}` : undefined} {...rest} />
  }
  function H3({ id, ...rest }: ComponentProps<'h3'>) {
    return <h3 id={id ? `${doc.lang}-${id}` : undefined} {...rest} />
  }
  function DocDate() {
    return <time dateTime={doc.date}>{formatDocDate(doc.date, doc.lang)}</time>
  }
  return { h2: H2, h3: H3, DocDate }
}

/**
 * /lamps and /lamps/privacy: the Lamps app's support page and privacy
 * policy, one column with every language on it, Turkish first. The language
 * switch is two in-page anchors, so there is no client JS. The `<html>` is
 * `lang="en"`, so each Turkish run says so itself.
 */
export function LampsPage({ docs }: LampsPageProps) {
  const [first, ...rest] = docs
  if (!first) return null

  return (
    <main>
      <Container sub>
        <HomeLink />

        <div className="blk" lang={first.lang}>
          <h1 className="name">{first.title}</h1>
          {rest.map((doc) => (
            <p key={doc.lang} className="lamps-sub" lang={doc.lang}>
              {doc.title}
            </p>
          ))}
          <nav aria-label="Dil / Language">
            <ul className="social">
              {docs.map((doc) => (
                <li key={doc.lang}>
                  <a href={`#${doc.lang}`} hrefLang={doc.lang} lang={doc.lang}>
                    {doc.language}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {docs.map((doc) => (
          <section
            key={doc.lang}
            className="blk lamps-lang"
            id={doc.lang}
            lang={doc.lang}
            aria-labelledby={`${doc.lang}-label`}
          >
            <p className="lamps-label" id={`${doc.lang}-label`}>
              {doc.language}
            </p>
            <Prose>
              <Mdx source={doc.body} components={componentsFor(doc)} />
            </Prose>
          </section>
        ))}

        <Footer />
      </Container>
    </main>
  )
}

export default LampsPage
