import type { ElementType, ReactNode } from 'react'

export type ContainerVariant = 'page' | 'post'

export type ContainerProps = {
  /** `page` → 672px column, 128px top. `post` → 768px column, 48/64/80px top. */
  variant?: ContainerVariant
  /** Sub-pages start at 64px rather than 128px. Ignored for `post`. */
  sub?: boolean
  as?: ElementType
  className?: string
  children: ReactNode
}

export function Container({
  variant = 'page',
  sub = false,
  as: Tag = 'div',
  className,
  children,
}: ContainerProps) {
  const classes = ['wrap']
  if (variant === 'post') classes.push('post')
  else if (sub) classes.push('sub')
  if (className) classes.push(className)

  return <Tag className={classes.join(' ')}>{children}</Tag>
}

export default Container
