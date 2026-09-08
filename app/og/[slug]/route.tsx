import { ImageResponse } from 'next/og'

import { getPost, getSite } from '@/lib/content'
import { formatLongDate } from '@/lib/format'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const FONT_TEXT =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?\'"()[]{}<>/\\|-–—_+=*&%$#@~`^ÇçĞğİıÖöŞşÜü'

type GoogleFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }

let fontsPromise: Promise<GoogleFont[]> | null = null

/** Funnel Sans from Google Fonts as TTF. satori cannot read woff2. */
async function loadFunnelSans(weight: 400 | 700): Promise<GoogleFont | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@${weight}&text=${encodeURIComponent(FONT_TEXT)}`
    const css = await fetch(url).then((res) => res.text())
    const match = /src: url\((?<src>[^)]+)\) format\('(opentype|truetype)'\)/.exec(css)
    const src = match?.groups?.['src']
    if (!src) return null
    const data = await fetch(src).then((res) => res.arrayBuffer())
    return { name: 'Funnel Sans', data, weight, style: 'normal' }
  } catch {
    return null
  }
}

/**
 * Memoise the fetched faces, but only once they actually arrive: a Google
 * Fonts blip during one build must not leave every later card unstyled.
 */
function loadFonts(): Promise<GoogleFont[]> {
  fontsPromise ??= Promise.all([loadFunnelSans(400), loadFunnelSans(700)])
    .then((fonts) => {
      const loaded = fonts.filter((font): font is GoogleFont => font !== null)
      if (loaded.length === 0) fontsPromise = null
      return loaded
    })
    .catch(() => {
      fontsPromise = null
      return []
    })

  return fontsPromise
}

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const site = getSite()
  const post = getPost(slug)

  const title = post?.title ?? site.name
  const subtitle = post ? `${site.name} · ${formatLongDate(post.date)}` : site.title
  const fonts = await loadFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#fbfcfd',
          color: '#0f172a',
          padding: '80px',
          fontFamily: 'Funnel Sans',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-1.6px',
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#64708a' }}>{subtitle}</div>
      </div>
    ),
    { ...size, ...(fonts.length > 0 ? { fonts } : {}) }
  )
}
