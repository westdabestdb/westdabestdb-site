import type { Metadata } from 'next'

import { LampsPage, lampsMetadata } from '@/components/lamps'
import { getLampsPage } from '@/lib/content'

export function generateMetadata(): Metadata {
  return lampsMetadata(getLampsPage('privacy'))
}

/** The Lamps (Lambalar) privacy policy — the App Store's privacy policy URL. */
export default function LampsPrivacy() {
  return <LampsPage docs={getLampsPage('privacy')} />
}
