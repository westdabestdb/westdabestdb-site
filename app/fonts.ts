import { Funnel_Sans, JetBrains_Mono } from 'next/font/google'

/**
 * The site font. Variable on Google Fonts (wght 300–800), and no `weight`
 * here means the whole axis ships as one file — so 400/500/600/700 all
 * resolve from the same face and interpolate.
 */
export const funnelSans = Funnel_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-funnel-sans',
})

/** Code blocks only. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})
