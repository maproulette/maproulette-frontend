import { useEffect, useState } from 'react'
import { resolveTeamImageUrl } from '@/lib/teamImage'
import { cn } from '@/lib/utils'

interface SidebarIndicatorProps {
  /**
   * The challenge's stored `avatarUrl` — either an external link or a
   * root-relative path to an image uploaded to MapRoulette.
   */
  avatarUrl?: string | null
  className?: string
}

/**
 * The square challenge image shown in the upper-right of a challenge card.
 * Renders nothing when the challenge has no image, or when the image fails to
 * load — external URLs are owner-supplied and can rot, and a broken-image icon
 * next to the title looks worse than no image at all.
 */
export const SidebarIndicator = ({ avatarUrl, className }: SidebarIndicatorProps) => {
  const src = resolveTeamImageUrl(avatarUrl)
  const [failed, setFailed] = useState(false)

  // A card can be recycled for a different challenge as lists re-render, so
  // clear the failure flag whenever the image being shown changes.
  useEffect(() => setFailed(false), [src])

  if (!src || failed) return null

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        'absolute top-12 right-4 h-12 w-12 rounded-lg bg-zinc-100 object-cover dark:bg-slate-700',
        className
      )}
    />
  )
}
