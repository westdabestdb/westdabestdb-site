import Image from 'next/image'

import { AvatarToy } from './fx/AvatarToy'
import { getSite } from '@/lib/content'

// New photo, Sep 2026. New filename on purpose: browsers had the old
// `gorkem.jpg` cached, and next/image rejects `?v=` cache-busting.
const AVATAR_SRC = '/static/images/gorkem-2026.jpg'

export type AvatarProps = {
  /** Defaults to the name in `content/site.ts`. */
  alt?: string
  priority?: boolean
}

/**
 * 64px circle, 32px of space under it. next/image resizes the 1254px source.
 *
 * The picture is wrapped in `AvatarToy`, which is the only client code here:
 * it adds click-to-spin and drag-to-throw on the wrapper's transform and
 * changes nothing about the image itself. Without JS — or under reduced
 * motion — the wrapper is an inert 64px div and the avatar looks the same.
 */
export function Avatar({ alt, priority = true }: AvatarProps) {
  const site = getSite()

  return (
    <AvatarToy>
      <Image
        className="avatar"
        src={AVATAR_SRC}
        alt={alt ?? site.name}
        width={64}
        height={64}
        quality={90}
        priority={priority}
        draggable={false}
      />
    </AvatarToy>
  )
}

export default Avatar
