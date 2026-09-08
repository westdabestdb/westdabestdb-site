'use client'

import { useEffect, useRef, useState } from 'react'

import { WORK_GROUPS, type WorkFilterId } from './groups'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'teams', label: 'With teams' },
  { id: 'own', label: 'On my own' },
] as const satisfies readonly { id: WorkFilterId; label: string }[]

const CONTROLS = WORK_GROUPS.map((entry) => entry.id).join(' ')

/**
 * Plain-text filter above the two work groups. It toggles `hidden` on the
 * `[data-group]` sections rendered by the server, so the rows themselves stay
 * static HTML and are all present for crawlers and JS-off readers.
 *
 * The sweep is scoped to the column this filter sits in rather than the whole
 * document, so a `data-group` anywhere else on the page is never touched.
 */
export function WorkFilter() {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<WorkFilterId>('all')

  useEffect(() => {
    const container = root.current?.closest('.wrap')
    if (!container) return

    container.querySelectorAll<HTMLElement>('[data-group]').forEach((group) => {
      group.hidden = !(active === 'all' || group.dataset.group === active)
    })
  }, [active])

  return (
    <div className="filter" role="group" aria-label="Filter work" ref={root}>
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          aria-pressed={active === filter.id}
          aria-controls={CONTROLS}
          onClick={() => setActive(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

export default WorkFilter
