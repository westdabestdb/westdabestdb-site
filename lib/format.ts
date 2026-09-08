const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** Post dates are `YYYY-MM-DD`; pin them to noon UTC so no timezone shifts them. */
export function toDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`)
}

/** "Feb 2025" — the year column on a writing row. */
export function formatMonthYear(date: string): string {
  return toDate(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** "Feb 12, 2025" — the date above a post title, and on the OG card. */
export function formatLongDate(date: string): string {
  return toDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * `"2026-09"` → `"September 2026"`. The long month form, used for the CV
 * spans in /llms.txt. A bare year passes through; so does anything that is
 * not a month this calendar has.
 */
export function formatMonth(value: string): string {
  const [year, month] = value.split('-')
  if (!year) return value
  const name = MONTHS[Number(month) - 1]
  return name ? `${name} ${year}` : year
}

/** RSS 2.0 needs RFC 822 dates. Posts carry a date only, so noon UTC it is. */
export function rfc822(date: string): string {
  return toDate(date).toUTCString()
}

/** Escape the five XML entities. Used by both feeds. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Cut `text` to `max` characters on a word boundary and add an ellipsis.
 * Search engines show around 160 characters of a description; a summary that
 * runs longer is truncated mid-word by them instead.
 */
export function truncate(text: string, max = 160): string {
  const value = text.trim()
  if (value.length <= max) return value

  // One character of the budget belongs to the ellipsis.
  const head = value.slice(0, max - 1)
  const space = head.lastIndexOf(' ')
  const cut = space > max / 2 ? head.slice(0, space) : head

  return `${cut.replace(/[\s,;:.!?-]+$/, '')}…`
}
