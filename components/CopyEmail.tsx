'use client'

import { useEffect, useRef, useState } from 'react'

export type CopyEmailProps = {
  email: string
  label?: string
  copiedLabel?: string
}

/** The async Clipboard API, then the old `execCommand` route. */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Blocked, insecure context, or the user denied it — try the fallback.
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

/**
 * Footer button. It only ever says "Email copied" after a write that actually
 * resolved; when both routes fail it stops pretending and shows the address as
 * a `mailto:` link instead.
 */
export function CopyEmail({
  email,
  label = 'Copy email',
  copiedLabel = 'Email copied',
}: CopyEmailProps) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    const ok = await writeToClipboard(email)
    if (!ok) {
      setFailed(true)
      return
    }

    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }

  if (failed) {
    return <a href={`mailto:${email}`}>{email}</a>
  }

  return (
    <button type="button" onClick={copy} aria-live="polite">
      {copied ? copiedLabel : label}
    </button>
  )
}

export default CopyEmail
