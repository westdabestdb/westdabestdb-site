/**
 * The two `<Section>`s on /work that the filter shows and hides. Kept out of
 * `WorkFilter.tsx` because that module is `'use client'`: every export of a
 * client module reaches a server component as a client reference, not as the
 * value itself, so the page could not read these ids from there.
 */
export const WORK_GROUPS = [
  { id: 'work-with-teams', group: 'teams' },
  { id: 'work-on-my-own', group: 'own' },
] as const

export type WorkGroupId = (typeof WORK_GROUPS)[number]['group']
export type WorkFilterId = 'all' | WorkGroupId
