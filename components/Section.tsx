import Link from 'next/link'
import type { ReactNode } from 'react'

export type SectionProps = {
  /** The grey h2 above the block. */
  label: string
  /** Makes the label a link and reveals the "→" on hover. */
  href?: string
  /** So another control can point at this section with `aria-controls`. */
  id?: string
  /** `data-group` hook — `<WorkFilter>` toggles `hidden` on these. */
  dataGroup?: string
  children: ReactNode
}

/** A 16px-gap block with a grey label heading. */
export function Section({ label, href, id, dataGroup, children }: SectionProps) {
  const heading = <h2 className="lbl">{label}</h2>

  return (
    <section className="blk" id={id} data-group={dataGroup}>
      {href ? <Link href={href}>{heading}</Link> : heading}
      {children}
    </section>
  )
}

export default Section
