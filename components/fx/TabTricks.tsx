'use client'

import { useEffect } from 'react'

/** What the tab says while you are off reading something else. */
const HIDDEN_TITLE = 'still here.'

const MONO = 'font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;'
const BOX_STYLE = `${MONO}font-size:12px;line-height:1.35;font-weight:600;`
const LINE_STYLE = `${MONO}font-size:12px;line-height:1.7;`
const DIM_STYLE = `${MONO}font-size:12px;line-height:1.7;opacity:.6;`

/** Module-level, so StrictMode's double effect still prints exactly one. */
let signed = false

export type TabTricksProps = {
  /** All three come from `lib/content` `getSite()`, passed down as strings. */
  name: string
  email: string
  repo: string
}

/**
 * Two small things that happen outside the page.
 *
 * (a) Leave the tab and the title becomes "still here."; come back and it is
 * whatever it was. The old title is read at hide time rather than on mount,
 * because Next rewrites `document.title` on every route change.
 *
 * (b) One console signature per page load — a name in a box-drawing box, a
 * line for whoever opens devtools, and the repo. Always, dev and production
 * alike, and never twice.
 *
 * Client-only and text-free: it renders nothing, so no-JS visitors lose
 * nothing. There is no CSS for it.
 */
export function TabTricks({ name, email, repo }: TabTricksProps) {
  useEffect(() => {
    let saved: string | null = null

    function onVisibility() {
      if (document.hidden) {
        saved = document.title
        document.title = HIDDEN_TITLE
      } else if (saved !== null) {
        document.title = saved
        saved = null
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      // Never leave the placeholder behind if we unmount while hidden.
      if (saved !== null) document.title = saved
    }
  }, [])

  useEffect(() => {
    if (signed) return
    signed = true

    const label = ` ${name} `
    const rule = '─'.repeat([...label].length)

    console.log(
      `%c┌${rule}┐\n│${label}│\n└${rule}┘\n` +
        `%cHi. You read consoles too. ${email}\n` +
        `%cSource: https://github.com/${repo}`,
      BOX_STYLE,
      LINE_STYLE,
      DIM_STYLE,
    )
  }, [name, email, repo])

  return null
}

export default TabTricks
