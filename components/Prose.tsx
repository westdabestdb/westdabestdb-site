import type { ReactNode } from 'react'

export type ProseProps = {
  children: ReactNode
  className?: string
}

/**
 * MDX body wrapper. All the typography lives in `.prose-v3` in
 * `app/globals.css` so plain HTML from MDX is styled without a component map.
 */
export function Prose({ children, className }: ProseProps) {
  return <div className={className ? `prose-v3 ${className}` : 'prose-v3'}>{children}</div>
}

export default Prose
