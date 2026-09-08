import type { SocialLink } from '@/lib/content'

export type SocialLinksProps = {
  links: SocialLink[]
}

/** External sites and the PDF open in a new tab; mailto stays in place. */
function opensAway(href: string): boolean {
  return /^https?:\/\//.test(href) || /\.pdf($|[?#])/.test(href)
}

/** The 20px `t` row under the bio. Hover turns a link `p`. */
export function SocialLinks({ links }: SocialLinksProps) {
  return (
    <ul className="social">
      {links.map((link) => (
        <li key={link.label}>
          {opensAway(link.href) ? (
            <a href={link.href} target="_blank" rel="me noreferrer">
              {link.label}
            </a>
          ) : (
            /* mailto: and /feed.xml are not app routes — plain anchors. */
            <a href={link.href}>{link.label}</a>
          )}
        </li>
      ))}
    </ul>
  )
}

export default SocialLinks
