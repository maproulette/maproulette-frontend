import { useState } from 'react'
import { type BasemapSettings, resolveMapStyle } from './basemap'

/**
 * The style a challenge's map opens on (see `resolveMapStyle`). Can be
 * changed after the map loads from the style picker.
 */
export const useInitialMapStyle = (
  challenge: (BasemapSettings & { id: number }) | undefined,
  user: { id: number; settings?: BasemapSettings | null } | undefined
) => {
  const key = `${challenge?.id}:${user?.id}`
  const [resolved, setResolved] = useState(() => ({
    key,
    style: resolveMapStyle(challenge, user?.settings),
  }))

  if (resolved.key === key) return resolved.style

  const next = { key, style: resolveMapStyle(challenge, user?.settings) }
  setResolved(next)
  return next.style
}
