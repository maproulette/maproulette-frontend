import { AlertCircle, MapPin, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { nominatim, type PlaceDetail, type PlaceSuggestion } from '@/api/nominatim'
import { DEFAULT_WORLD_BOUNDS, isWorldBounds } from '@/components/Map/mapUtils'
import type {
  LocationGeojson,
  PlaceFilter,
} from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { useExploreChallengesSearchContext } from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

const osmTypeToPrefix = (osmType: string): string | undefined => {
  switch (osmType) {
    case 'node':
      return 'N'
    case 'way':
      return 'W'
    case 'relation':
      return 'R'
    default:
      return undefined
  }
}

// Boundaries are sent to the server as a request body, which is capped there.
// Anything larger (a whole country, say) filters by its bounding box instead,
// where the difference between the box and the boundary hardly matters.
const MAX_PLACE_GEOMETRY_BYTES = 1_000_000

const boundsToString = (bbox: string[]): string => {
  const [minLat, maxLat, minLon, maxLon] = bbox.map(Number)
  return `${minLon},${minLat},${maxLon},${maxLat}`
}

const applyLocation = (
  place: PlaceDetail,
  placeKey: string,
  setBounds: (bounds: string) => void,
  requestFitBounds: (bounds: string) => void,
  setLocationGeojson: (geojson: LocationGeojson) => void,
  setLocationBounds: (bounds: string | undefined) => void,
  setResolvedPlaceFilter: (filter: PlaceFilter | null) => void,
  // The camera is left alone when it was already positioned from the URL hash,
  // but the place still has to filter the results either way.
  moveMap = true
) => {
  if (place.boundingbox) {
    const boundsString = boundsToString(place.boundingbox)
    setLocationBounds(boundsString)
    if (moveMap) {
      setBounds(boundsString)
      requestFitBounds(boundsString)
    }
  }

  if (place.geojson) {
    setLocationGeojson(place.geojson as LocationGeojson)
    const geometryJson = JSON.stringify(place.geojson)
    setResolvedPlaceFilter(
      geometryJson.length <= MAX_PLACE_GEOMETRY_BYTES
        ? { key: `${placeKey}:boundary`, geometryJson }
        : null
    )
  } else {
    // Nominatim has no boundary for some places (a node, a POI); the bounding
    // box set above is then all there is to filter by.
    setResolvedPlaceFilter(null)
  }
}

export const LocationSearchFilter = () => {
  const { t } = useIntl()
  const {
    locationOsmType,
    locationOsmId,
    isLocationLoading,
    setBounds,
    setLocationOsm,
    setIsLocationLoading,
    setLocationGeojson,
    setLocationBounds,
    setLocationName,
    setResolvedPlaceFilter,
    requestFitBounds,
    bounds,
  } = useExploreChallengesSearchContext()

  const [locationInput, setLocationInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Which place (osm type + id) the bbox and input text were resolved for, so
  // a place arriving from elsewhere -- the cookie, the URL, browser
  // back/forward -- gets re-resolved instead of leaving a stale filter behind.
  const resolvedPlaceRef = useRef<string | null>(null)
  const selectedLocationRef = useRef('')

  const searchLocation = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!trimmed || query === selectedLocationRef.current) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsSearching(true)
      setError('')

      try {
        const data = await nominatim.search(trimmed, controller.signal)

        if (data.length === 0) {
          setError(
            t(
              'exploreChallenges.filterBar.location.noResults',
              undefined,
              'No locations found. Try a different search term.'
            )
          )
        }
        setSuggestions(data)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          logger.error('Error fetching suggestions', { error: err })
          setError(
            t(
              'exploreChallenges.filterBar.location.networkError',
              undefined,
              'Network error. Please check your connection.'
            )
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    },
    [t]
  )

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  useEffect(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
      setHighlightedIndex(-1)
    }
  }, [suggestions])

  useEffect(() => {
    if (!locationOsmType || !locationOsmId) return
    const placeKey = `${locationOsmType}${locationOsmId}`
    if (resolvedPlaceRef.current === placeKey) return

    const loadLocation = async () => {
      resolvedPlaceRef.current = placeKey
      setIsLocationLoading(true)

      try {
        const place = await nominatim.lookup(placeKey)

        if (place) {
          setLocationInput(place.display_name)
          selectedLocationRef.current = place.display_name
          setLocationName(place.display_name)

          const hasInitialBoundsFromUrl = bounds && !isWorldBounds(bounds)

          applyLocation(
            place,
            placeKey,
            setBounds,
            requestFitBounds,
            setLocationGeojson,
            setLocationBounds,
            setResolvedPlaceFilter,
            !hasInitialBoundsFromUrl
          )
        } else {
          setError(
            t('exploreChallenges.filterBar.location.notFound', undefined, 'Location not found')
          )
        }
      } catch (err) {
        logger.error('Error loading location', { error: err })
        setError(
          t('exploreChallenges.filterBar.location.loadFailed', undefined, 'Failed to load location')
        )
      } finally {
        setIsLocationLoading(false)
      }
    }

    loadLocation()
  }, [
    locationOsmType,
    locationOsmId,
    setIsLocationLoading,
    setBounds,
    requestFitBounds,
    setLocationGeojson,
    setLocationBounds,
    setLocationName,
    setResolvedPlaceFilter,
    bounds,
    t,
  ])

  useEffect(() => {
    if (
      locationOsmType === undefined &&
      locationOsmId === undefined &&
      selectedLocationRef.current
    ) {
      setLocationInput('')
      selectedLocationRef.current = ''
      resolvedPlaceRef.current = null
      setSuggestions([])
    }
  }, [locationOsmType, locationOsmId])

  // Reason: stable reference for async location detail fetcher used by handleSelectLocation
  const getLocationDetails = useCallback(
    async (suggestion: PlaceSuggestion): Promise<PlaceDetail | null> => {
      try {
        const prefix = suggestion.osm_type ? osmTypeToPrefix(suggestion.osm_type) : undefined
        if (!prefix || suggestion.osm_id === undefined) {
          return null
        }

        return await nominatim.lookup(`${prefix}${suggestion.osm_id}`)
      } catch (err) {
        logger.error('Error fetching location details', { error: err })
        setError(
          t(
            'exploreChallenges.filterBar.location.geometryLoadFailed',
            undefined,
            'Failed to load location geometry'
          )
        )
        return null
      }
    },
    [t]
  )

  // Reason: stable reference for location selection handler passed to suggestion list items
  const handleSelectLocation = useCallback(
    async (suggestion: PlaceSuggestion) => {
      setLocationInput(suggestion.display_name)
      selectedLocationRef.current = suggestion.display_name
      setLocationName(suggestion.display_name)
      setShowSuggestions(false)
      setError('')
      setSuggestions([])

      const prefix = suggestion.osm_type ? osmTypeToPrefix(suggestion.osm_type) : undefined
      if (prefix && suggestion.osm_id !== undefined) {
        // Claim the place before the state change so the effect above doesn't
        // look it up a second time; the details are fetched right below.
        resolvedPlaceRef.current = `${prefix}${suggestion.osm_id}`
        setLocationOsm(prefix, suggestion.osm_id)
        // Filter by the new place immediately -- the suggestion already
        // carries its bounding box -- rather than leaving the previous
        // place's boundary in force until the details arrive.
        setResolvedPlaceFilter(null)
        if (suggestion.boundingbox) {
          setLocationBounds(boundsToString(suggestion.boundingbox))
        }
      } else {
        setError(
          t(
            'exploreChallenges.filterBar.location.noOsmId',
            undefined,
            'Selected location has no OSM identifier'
          )
        )
        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const place = await getLocationDetails(suggestion)
      if (place) {
        applyLocation(
          place,
          `${prefix}${suggestion.osm_id}`,
          setBounds,
          requestFitBounds,
          setLocationGeojson,
          setLocationBounds,
          setResolvedPlaceFilter
        )
      }
    },
    [
      getLocationDetails,
      setLocationOsm,
      setBounds,
      requestFitBounds,
      setLocationGeojson,
      setLocationBounds,
      setLocationName,
      setResolvedPlaceFilter,
      t,
    ]
  )

  // Reason: stable reference for clear button click handler
  const handleClearLocation = useCallback(() => {
    setLocationInput('')
    selectedLocationRef.current = ''
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    setSuggestions([])
    setError('')
    setLocationOsm(undefined, undefined)
    setBounds(DEFAULT_WORLD_BOUNDS)
    setLocationGeojson(null as LocationGeojson)
    setLocationName(undefined)
    // The place's bounding box and boundary both have to go, or `placeFilter`
    // keeps narrowing the challenge list to a location that is no longer shown.
    setLocationBounds(undefined)
    setResolvedPlaceFilter(null)
    resolvedPlaceRef.current = ''

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    inputRef.current?.focus()
  }, [
    setLocationOsm,
    setBounds,
    setLocationGeojson,
    setLocationName,
    setLocationBounds,
    setResolvedPlaceFilter,
  ])

  // Reason: stable reference for keyboard navigation handler attached to input element
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (showSuggestions && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectLocation(suggestions[highlightedIndex])
        } else {
          searchLocation(locationInput)
        }
        return
      }

      if (!showSuggestions || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Escape':
          setShowSuggestions(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [
      showSuggestions,
      suggestions,
      highlightedIndex,
      handleSelectLocation,
      searchLocation,
      locationInput,
    ]
  )

  const isLoading = isSearching || isLocationLoading
  const hasSelection = selectedLocationRef.current && locationInput === selectedLocationRef.current
  const inputId = useId()

  return (
    <Popover open={showSuggestions || !!error} onOpenChange={setShowSuggestions}>
      <PopoverTrigger asChild>
        <div className="relative w-full md:w-56">
          <div className="relative flex items-center">
            <MapPin
              className={cn(
                'absolute left-3 h-4 w-4',
                hasSelection
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-400 dark:text-zinc-500'
              )}
            />
            <Input
              ref={inputRef}
              id={inputId}
              type="text"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value)
                setError('')
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              placeholder={t(
                'exploreChallenges.filterBar.location.searchPlaceholder',
                undefined,
                'Search location...'
              )}
              className="bg-white pr-9 pl-9 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/50"
              aria-autocomplete="list"
              aria-controls={`${inputId}-listbox`}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {isLoading && <Spinner className="text-emerald-600 dark:text-emerald-400" />}
              {locationInput && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleClearLocation}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-6 w-6 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label={t(
                    'exploreChallenges.filterBar.location.clearAriaLabel',
                    undefined,
                    'Clear location'
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        aria-label={t(
          'exploreChallenges.filterBar.location.suggestionsAriaLabel',
          undefined,
          'Location suggestions'
        )}
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {error ? (
          <div className="flex items-center gap-1.5 px-3 py-2 text-red-700 text-xs dark:text-red-400">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div id={`${inputId}-listbox`} role="listbox" className="max-h-64 overflow-auto">
            {suggestions.map((suggestion, index) => {
              const [primary, ...secondary] = suggestion.display_name.split(',')
              return (
                <Button
                  key={suggestion.place_id}
                  variant="ghost"
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onClick={() => handleSelectLocation(suggestion)}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'h-auto w-full justify-start rounded-none px-3 py-2.5 text-left',
                    index === highlightedIndex
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-zinc-50 dark:hover:bg-slate-700'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MapPin
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        index === highlightedIndex
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-400 dark:text-zinc-500'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {primary}
                      </p>
                      {secondary.length > 0 && (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {secondary.join(',').trim()}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
