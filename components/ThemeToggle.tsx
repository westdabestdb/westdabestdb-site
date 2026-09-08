'use client'

import { useSyncExternalStore } from 'react'
import type { MouseEvent } from 'react'

export const THEME_STORAGE_KEY = 'theme'

function currentlyDark(): boolean {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark') return true
  if (attr === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Re-render when `data-theme` changes or the system preference flips. */
function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  query.addEventListener('change', onChange)

  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  return () => {
    query.removeEventListener('change', onChange)
    observer.disconnect()
  }
}

/** The whole persisted-theme contract: the attribute plus localStorage. */
function applyTheme(next: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Storage unavailable; the choice just will not persist.
  }
}

/**
 * Circular reveal: the new theme wipes over the old one from the button.
 * Only when the View Transition API exists and reduced motion is off —
 * otherwise `applyTheme` runs on its own and the switch is instant, exactly
 * as before. See the "Theme toggle circular reveal" block in `app/fx.css`.
 */
function reveal(button: HTMLButtonElement, next: 'light' | 'dark'): void {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (still || typeof document.startViewTransition !== 'function') {
    applyTheme(next)
    return
  }

  const box = button.getBoundingClientRect()
  const x = box.left + box.width / 2
  const y = box.top + box.height / 2
  // Distance to the farthest viewport corner, so the circle clears the page.
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = document.startViewTransition(() => {
    applyTheme(next)
  })

  void transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: 520,
          easing: 'cubic-bezier(.2,.7,.2,1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
    .catch(() => {
      // A skipped transition still applied the theme; nothing to undo.
    })
}

/**
 * Plain-text footer toggle. The label names the theme you are switching to,
 * so it reads "Dark" in light mode. The server snapshot is light; the real
 * value arrives right after the pre-paint script in `app/layout.tsx` has run.
 */
export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    currentlyDark,
    () => false
  )

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    reveal(event.currentTarget, dark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}

export default ThemeToggle
