import type { Metadata } from 'next'

import { LampsPage, lampsMetadata } from '@/components/lamps'
import { getLampsPage } from '@/lib/content'

export function generateMetadata(): Metadata {
  return lampsMetadata(getLampsPage('support'))
}

/** Support for the Lamps (Lambalar) app — the App Store's support URL. */
export default function LampsSupport() {
  return <LampsPage docs={getLampsPage('support')} />
}
