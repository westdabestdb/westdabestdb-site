import { buildSummary } from '@/lib/agent-summary'

export const dynamic = 'force-static'

/** The same object `/llms.txt` is written from, as JSON. */
export function GET(): Response {
  return new Response(`${JSON.stringify(buildSummary(), null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
