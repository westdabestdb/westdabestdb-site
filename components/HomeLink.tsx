'use client'

import { useRouter } from 'next/navigation'

/**
 * The way back from a sub-page: a plain "← Back" text button, first in the
 * column. Not sticky, no padding, no background — a line of text that happens
 * to be a control, and it takes part in the page's fade-up stagger as item 0.
 *
 * Goes back in history when the previous page was on this site; otherwise
 * (deep link, new tab) it goes home, so it never leaves the site.
 */
export function HomeLink() {
  const router = useRouter()

  function back() {
    const cameFromHere =
      typeof document !== 'undefined' &&
      document.referrer !== '' &&
      new URL(document.referrer).origin === window.location.origin &&
      window.history.length > 1
    if (cameFromHere) router.back()
    else router.push('/')
  }

  return (
    <button type="button" className="home-link" onClick={back}>
      ← Back
    </button>
  )
}

export default HomeLink
