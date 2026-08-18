import { AlertCircle, CheckCircle2, Loader2, MapPin, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { DEFAULT_WORLD_BOUNDS, isWorldBounds } from '@/components/Map/mapUtils'
import type { LocationGeojson } from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { useExploreChallengesSearchContext } from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

export interface PlaceSuggestion {
  display_name: string
  place_id: string
  osm_type?: 'node' | 'way' | 'relation'
  osm_id?: number
  type?: string
  importance?: number
  boundingbox?: string[]
}

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

export interface PlaceDetail {
  display_name: string
  boundingbox?: string[]
  geojson?:
    | {
        type: 'Polygon'
        coordinates: number[][][]
      }
    | {
        type: 'MultiPolygon'
        coordinates: number[][][][]
      }
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'MapRoulette/4.0'
const DEBOUNCE_MS = 1000
const MIN_QUERY_LENGTH = 3

const fetchNominatim = async (url: string, signal?: AbortSignal) => {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal,
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

const boundsToString = (bbox: string[]): string => {
  const [minLat, maxLat, minLon, maxLon] = bbox.map(Number)
  return `${minLon},${minLat},${maxLon},${maxLat}`
}

const applyLocation = (
  place: PlaceDetail,
  setBounds: (bounds: string) => void,
  requestFitBounds: (bounds: string) => void,
  setLocationGeojson: (geojson: LocationGeojson) => void
) => {
  if (place.boundingbox) {
    const boundsString = boundsToString(place.boundingbox)
    setBounds(boundsString)
    requestFitBounds(boundsString)
    if (place.geojson) {
      setLocationGeojson(place.geojson as LocationGeojson)
    }
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
  const initialLocationLoadedRef = useRef(false)
  const selectedLocationRef = useRef('')

  useEffect(() => {
    if (locationInput.length < MIN_QUERY_LENGTH || locationInput === selectedLocationRef.current) {
      setSuggestions([])
      setError('')
      return
    }

    const timeoutId = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsSearching(true)
      setError('')

      try {
        const data = await fetchNominatim(
          `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(locationInput)}&limit=8&addressdetails=1`,
          controller.signal
        )

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
          logger.error('Error fetching suggestions', { error: String(err) })
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
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [locationInput, t])

  useEffect(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
      setHighlightedIndex(-1)
    }
  }, [suggestions])

  useEffect(() => {
    if (!locationOsmType || !locationOsmId || initialLocationLoadedRef.current) return

    const loadLocation = async () => {
      initialLocationLoadedRef.current = true
      setIsLocationLoading(true)

      try {
        const lookupData = await fetchNominatim(
          `${NOMINATIM_BASE_URL}/lookup?osm_ids=${locationOsmType}${locationOsmId}&polygon_geojson=1&format=jsonv2`
        )
        const place: PlaceDetail | null = lookupData[0] || null

        if (place) {
          setLocationInput(place.display_name)
          selectedLocationRef.current = place.display_name

          const hasInitialBoundsFromUrl = bounds && !isWorldBounds(bounds)

          if (hasInitialBoundsFromUrl) {
            if (place.geojson) {
              setLocationGeojson(place.geojson as LocationGeojson)
            }
          } else {
            applyLocation(place, setBounds, requestFitBounds, setLocationGeojson)
          }
        } else {
          setError(
            t('exploreChallenges.filterBar.location.notFound', undefined, 'Location not found')
          )
        }
      } catch (err) {
        logger.error('Error loading location', { error: String(err) })
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

        const data = await fetchNominatim(
          `${NOMINATIM_BASE_URL}/lookup?osm_ids=${prefix}${suggestion.osm_id}&polygon_geojson=1&format=jsonv2`
        )
        return data[0] || null
      } catch (err) {
        logger.error('Error fetching location details', { error: String(err) })
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
      setShowSuggestions(false)
      setError('')
      setSuggestions([])

      const prefix = suggestion.osm_type ? osmTypeToPrefix(suggestion.osm_type) : undefined
      if (prefix && suggestion.osm_id !== undefined) {
        setLocationOsm(prefix, suggestion.osm_id)
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
        applyLocation(place, setBounds, requestFitBounds, setLocationGeojson)
      }
    },
    [getLocationDetails, setLocationOsm, setBounds, requestFitBounds, setLocationGeojson, t]
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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    inputRef.current?.focus()
  }, [setLocationOsm, setBounds, setLocationGeojson])

  // Reason: stable reference for keyboard navigation handler attached to input element
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelectLocation(suggestions[highlightedIndex])
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [showSuggestions, suggestions, highlightedIndex, handleSelectLocation]
  )

  const isLoading = isSearching || isLocationLoading
  const hasSelection = selectedLocationRef.current && locationInput === selectedLocationRef.current
  const inputId = useId()

  return (
    <Popover open={showSuggestions || !!error} onOpenChange={setShowSuggestions}>
      <PopoverTrigger asChild>
        <div className="relative w-full md:w-56">
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <Input
              ref={inputRef}
              id={inputId}
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
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
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              )}
              {hasSelection && !isLoading && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
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
