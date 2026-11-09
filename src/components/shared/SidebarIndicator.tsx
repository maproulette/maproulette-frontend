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
  /**
   * Told when the image turns out not to render, so a caller that reserves
   * space for it can give that space back.
   */
  onLoadFailure?: () => void
}

/**
 * The square challenge image shown in the upper-right of a challenge card.
 * Renders nothing when the challenge has no image, or when the image fails to
 * load — the url is addressed by owning team and answers 404 when that team
 * has no approved image, and an owner-supplied external URL can simply rot.
 * Either way a broken-image icon next to the title looks worse than no image.
 */
export const SidebarIndicator = ({
  avatarUrl,
  className,
  onLoadFailure,
}: SidebarIndicatorProps) => {
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
      onError={() => {
        setFailed(true)
        onLoadFailure?.()
      }}
      className={cn(
        'absolute top-12 right-4 h-12 w-12 rounded-lg bg-zinc-100 object-cover dark:bg-slate-700',
        className
      )}
    />
  )
}
