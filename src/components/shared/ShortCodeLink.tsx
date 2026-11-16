import type { ComponentProps } from 'react'
import { useJosmShortCodes } from '@/hooks/useJosmShortCodes'
import { parseOsmShortCodeLink } from '@/lib/shortCodes'

export const ShortCodeLink = ({ href, onClick, ...props }: ComponentProps<'a'>) => {
  const josm = useJosmShortCodes()

  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        const shortCode = josm && href ? parseOsmShortCodeLink(href) : null
        if (!josm || !shortCode) return
        event.preventDefault()
        if (shortCode.kind === 'osmElements') {
          josm.loadElements(shortCode.elements)
        } else {
          josm.zoomToViewport(shortCode.zoom, shortCode.lat, shortCode.lon)
        }
      }}
    />
  )
}
