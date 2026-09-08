import fs from 'node:fs'
import path from 'node:path'

import { imageSize } from 'image-size'
import { MDXRemote, type MDXRemoteProps } from 'next-mdx-remote/rsc'
import Image from 'next/image'
import Link from 'next/link'
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react'
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

const prettyCodeOptions: PrettyCodeOptions = {
  // Dual theme: shiki writes --shiki-light / --shiki-dark on every span and
  // app/globals.css picks the right one. `keepBackground: false` keeps the
  // block's background as var(--code) — background only, no border.
  theme: { light: 'github-light', dark: 'github-dark' },
  keepBackground: false,
  // Blocks only: plain inline `code` stays untouched so it keeps the quiet
  // grey treatment in globals.css. Inline highlighting still works via `{:js}`.
  defaultLang: { block: 'plaintext' },
}

export const mdxOptions: NonNullable<MDXRemoteProps['options']> = {
  parseFrontmatter: false,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
  },
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement>
type ImageProps = ImgHTMLAttributes<HTMLImageElement>

/** Internal hrefs go through next/link; external ones open in a new tab. */
function MdxLink({ href = '', children, ...rest }: AnchorProps) {
  if (href.startsWith('/')) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    )
  }
  if (href.startsWith('#')) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" {...rest}>
      {children}
    </a>
  )
}

/* ------------------------------------------------------------------ *
 * Images
 * ------------------------------------------------------------------ */

const PUBLIC_DIR = path.join(process.cwd(), 'public')

/** Posts render on the server (at build time for every published slug), so a
 *  file is read at most once per process. */
const sizeCache = new Map<string, { width: number; height: number } | null>()

/** Real pixel dimensions of `/static/...` on disk, or `null` if unreadable. */
function measure(src: string): { width: number; height: number } | null {
  const cached = sizeCache.get(src)
  if (cached !== undefined) return cached

  let size: { width: number; height: number } | null = null
  try {
    const file = path.join(PUBLIC_DIR, path.normalize(src))
    if (file.startsWith(PUBLIC_DIR)) {
      const { width, height } = imageSize(fs.readFileSync(file))
      if (width && height) size = { width, height }
    }
  } catch {
    // Missing or unreadable file: fall back to a plain <img>.
  }

  sizeCache.set(src, size)
  return size
}

/**
 * `![alt](/static/images/blog/x.jpg)` as a `next/image`, sized from the file
 * on disk so the browser reserves the right box and never shifts the text.
 * External URLs (and anything we cannot measure) stay a plain lazy `<img>`.
 */
function MdxImage({ src, alt = '', width, height, ...rest }: ImageProps) {
  const local = typeof src === 'string' && src.startsWith('/') ? measure(src) : null

  if (!local || typeof src !== 'string') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={typeof src === 'string' ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        {...rest}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={local.width}
      height={local.height}
      sizes="(max-width: 768px) 100vw, 768px"
      {...rest}
    />
  )
}

export const mdxComponents: MDXRemoteProps['components'] = {
  a: MdxLink,
  img: MdxImage,
}

export type MdxProps = {
  source: string
  components?: MDXRemoteProps['components']
}

/** Render an MDX body. Wrap the result in `<Prose>` for the post typography. */
export function Mdx({ source, components }: MdxProps) {
  return (
    <MDXRemote
      source={source}
      options={mdxOptions}
      components={{ ...mdxComponents, ...components }}
    />
  )
}

export default Mdx
