'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import '@/app/turntable.css'
import { create, type JazzEngine } from './engine'

/** Nothing ever changes, so the store never notifies. */
const noSubscribe = () => () => {}

/**
 * A 64px record in the bottom-right corner. Click it and a lo-fi jazz trio
 * starts playing — generated live by `./engine.ts`, not streamed: there is no
 * audio file anywhere in this repo.
 *
 * The record is the whole control. There is deliberately no caption beside it
 * — Görkem asked for the word to go — so the `title` and the `aria-label`
 * carry it instead, and `app/turntable.css` has no `.tt-label` rule left.
 *
 * Mounted once in the root layout, so the music survives a client-side
 * navigation; the engine is created on the first click, which is where the
 * autoplay policy wants the AudioContext to come from. Nothing is rendered
 * server-side, so a visitor without JavaScript sees no control at all, and the
 * whole thing is one `<button>`, so a tap works exactly like a click.
 *
 * Sizes, the disc gradients and the arm's two poses are `app/turntable.css`.
 */
export function Turntable() {
  // `false` on the server and on the hydrating pass, `true` from then on: the
  // control is client-only, so a visitor without JavaScript gets no markup at
  // all rather than a button that does nothing.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
  const [playing, setPlaying] = useState(false)
  const engine = useRef<JazzEngine | null>(null)

  // Leaving the page (or going into the back/forward cache) stops the music
  // rather than leaving a suspended context playing on the way back.
  useEffect(() => {
    function stop() {
      engine.current?.pause()
      setPlaying(false)
    }
    window.addEventListener('pagehide', stop)
    return () => window.removeEventListener('pagehide', stop)
  }, [])

  useEffect(
    () => () => {
      engine.current?.dispose()
      engine.current = null
    },
    [],
  )

  const toggle = useCallback(() => {
    let current = engine.current
    if (!current) {
      current = create()
      engine.current = current
    }
    if (current.playing) {
      current.pause()
      setPlaying(false)
    } else {
      void current.play()
      setPlaying(true)
    }
  }, [])

  if (!mounted) return null

  return (
    <button
      type="button"
      className="tt"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? 'Pause jazz' : 'Play jazz'}
      title="Lo-fi jazz, made on the fly. Click to play."
      {...(playing ? { 'data-playing': '' } : null)}
    >
      <span className="tt-deck">
        <span className="tt-disc" />
        <svg
          className="tt-arm"
          viewBox="0 0 26 26"
          width="26"
          height="26"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="22" cy="4" r="2.6" fill="currentColor" />
          <path
            d="M21 5.5 L9.4 16.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M9.8 15.2 L11.6 17 L8.8 19.8 L7 18 Z" fill="currentColor" />
        </svg>
      </span>
    </button>
  )
}

export default Turntable
