import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import './globals.css'
import { funnelSans, jetbrainsMono } from './fonts'
import { Cursor } from '@/components/fx/Cursor'
import { Sounds } from '@/components/fx/Sounds'
import { HoverPreview } from '@/components/fx/HoverPreview'
import { Ripple } from '@/components/fx/Ripple'
import { TabTricks } from '@/components/fx/TabTricks'
import { Turntable } from '@/components/fx/turntable/Turntable'
import { getSite } from '@/lib/content'

/** Runs before paint so the stored theme never flashes. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`

export function generateMetadata(): Metadata {
  const site = getSite()
  const description = `${site.title}.`

  return {
    metadataBase: new URL(site.siteUrl),
    title: { default: site.name, template: `%s · ${site.name}` },
    description,
    authors: [{ name: site.name, url: site.siteUrl }],
    creator: site.name,
    manifest: '/static/favicons/site.webmanifest',
    // No `canonical` here: metadata merges per key, so a canonical on the
    // root layout would claim every page is the home page. Each route sets
    // its own, next to its own `openGraph.url`.
    alternates: {
      types: { 'application/rss+xml': '/feed.xml' },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: site.name,
      title: site.name,
      description,
      url: site.siteUrl,
      images: ['/og/home'],
    },
    twitter: {
      card: 'summary_large_image',
      title: site.name,
      description,
      images: ['/og/home'],
    },
    icons: {
      icon: [
        { url: '/static/favicons/favicon.ico', sizes: 'any' },
        { url: '/static/favicons/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
        { url: '/static/favicons/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
        { url: '/static/favicons/android-chrome-96x96.png', type: 'image/png', sizes: '96x96' },
      ],
      apple: [{ url: '/static/favicons/apple-touch-icon.png', sizes: '180x180' }],
      other: [
        {
          rel: 'mask-icon',
          url: '/static/favicons/safari-pinned-tab.svg',
          color: '#171717',
        },
      ],
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const fonts = [funnelSans.variable, jetbrainsMono.variable].join(' ')
  // `TabTricks` is client-only, so the content it prints is passed as strings.
  const site = getSite()

  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <HoverPreview />
        <Cursor />
        <Sounds />
        <Ripple />
        <TabTricks name={site.name} email={site.email} repo={site.repo} />
        <Turntable />
        {children}
      </body>
    </html>
  )
}
