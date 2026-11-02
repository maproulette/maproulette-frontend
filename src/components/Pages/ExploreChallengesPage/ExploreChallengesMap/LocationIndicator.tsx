import bbox from '@turf/bbox'
import { MapPin } from 'lucide-react'
import { useIntl } from '@/i18n'
import { useExploreChallengesSearchContext } from '../contexts/ExploreChallengesSearchContext'

/**
 * Names the outlined area on the map, and recenters on it when clicked.
 *
 * The outline alone doesn't say which place it belongs to, and a boundary can
 * easily run off the edge of the viewport -- or out of it entirely, once the
 * user has panned away. Shown only when there is an outline drawn
 * (`locationGeojson`, the same thing LocationPolygonLayer renders), so it never
 * claims a filter that isn't visible.
 *
 * Recentering goes through `requestFitBounds`, the same path the location
 * search uses, so a click lands the camera exactly where picking the place did.
 */
export const LocationIndicator = () => {
  const { t } = useIntl()
  const { locationGeojson, locationName, requestFitBounds } = useExploreChallengesSearchContext()

  if (!locationGeojson || !locationName) return null

  const label = t({ id: 'exploreChallenges.map.locationIndicator.recenter', defaultMessage: 'Recenter on the outlined area: {name}' }, { name: locationName }
  )

  const recenter = () => {
    // The polygon itself is the source of truth here: the place's own bounding
    // box may be absent, and the outline is what the user is asking to see.
    const [west, south, east, north] = bbox(locationGeojson)
    requestFitBounds(`${west},${south},${east},${north}`)
  }

  return (
    <button
      type="button"
      onClick={recenter}
      title={label}
      aria-label={label}
      className="flex h-10 max-w-[16rem] cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/95 px-3 shadow-sm backdrop-blur-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 md:bg-white dark:border-slate-700 dark:bg-slate-900/95 dark:md:bg-slate-900 dark:hover:bg-slate-800"
    >
      <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600 md:h-4 md:w-4 dark:text-emerald-400" />
      {/* The button's accessible name carries the full phrase, so the visible
          text can be the bare name, truncated to the pill. */}
      <span
        aria-hidden="true"
        className="truncate font-medium text-xs text-zinc-700 dark:text-zinc-300"
      >
        {locationName}
      </span>
    </button>
  )
}
