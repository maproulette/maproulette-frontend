import { useSearch } from '@tanstack/react-router'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  boundsStringToPolygon,
  clampBoundsString,
  DEFAULT_WORLD_BOUNDS,
  intersectBoundsStrings,
} from '@/components/Map/mapUtils'
import type {
  DifficultyLevel,
  ViewMode,
  WorkOnCategory,
} from '@/components/Pages/ExploreChallengesPage/FilterBar/filterTypes'
import {
  difficultyMap,
  workOnCategoryMap,
} from '@/components/Pages/ExploreChallengesPage/FilterBar/filterUtils'
import { logger } from '@/lib/logger'
import type { ExploreChallengesRequest, ExtendedFindParamsSortBy } from '@/types/Challenge'
import type { TaskTilesParams } from '@/types/Task'

const COOKIE_PREFIX = 'mr4_'
const COOKIE_EXPIRY_DAYS = 365

const setCookie = (name: string, value: string, days: number = COOKIE_EXPIRY_DAYS): void => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${COOKIE_PREFIX}${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

const getCookie = (name: string): string | null => {
  const nameEQ = `${COOKIE_PREFIX}${name}=`
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length))
    }
  }
  return null
}

const removeCookie = (name: string): void => {
  document.cookie = `${COOKIE_PREFIX}${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

const setJSONCookie = (name: string, value: unknown, days?: number): void => {
  try {
    const jsonString = JSON.stringify(value)
    setCookie(name, jsonString, days)
  } catch (error) {
    logger.error(`Failed to set cookie ${name}`, { error: String(error) })
  }
}

const getJSONCookie = <T,>(name: string): T | null => {
  try {
    const cookieValue = getCookie(name)
    if (!cookieValue) return null
    return JSON.parse(cookieValue) as T
  } catch (error) {
    logger.error(`Failed to get cookie ${name}`, { error: String(error) })
    return null
  }
}

export type LocationGeojson =
  | {
      type: 'Polygon'
      coordinates: number[][][]
    }
  | {
      type: 'MultiPolygon'
      coordinates: number[][][][]
    }
  | null

/**
 * The boundary of the selected place, ready to send. Held pre-serialized
 * because these geometries are large: `key` stands in for the geometry in
 * React Query keys so the polygon itself is never hashed on a render.
 */
export interface PlaceFilter {
  key: string
  geometryJson: string
}

export interface ExploreChallengesSearchContextType {
  extendedFindParams: ExploreChallengesRequest
  taskTilesParams: TaskTilesParams

  bounds: string
  setBounds: Dispatch<SetStateAction<string>>
  zoom: number
  setZoom: Dispatch<SetStateAction<number>>
  locationOsmType: string | undefined
  locationOsmId: number | undefined
  setLocationOsm: (osmType: string | undefined, osmId: number | undefined) => void
  locationBounds: string | undefined
  setLocationBounds: Dispatch<SetStateAction<string | undefined>>
  setResolvedPlaceFilter: Dispatch<SetStateAction<PlaceFilter | null>>
  /** The viewport and the selected place don't overlap, so nothing can match */
  hasEmptyPlaceIntersection: boolean
  global: boolean | undefined
  setGlobal: Dispatch<SetStateAction<boolean | undefined>>

  locationGeojson: LocationGeojson
  setLocationGeojson: Dispatch<SetStateAction<LocationGeojson>>
  pendingFitBounds: string | null
  clearPendingFitBounds: () => void
  requestFitBounds: (bounds: string) => void

  difficulty: DifficultyLevel
  setDifficulty: Dispatch<SetStateAction<DifficultyLevel>>
  workOn: WorkOnCategory
  setWorkOn: Dispatch<SetStateAction<WorkOnCategory>>
  selectedCategories: string[]
  setSelectedCategories: Dispatch<SetStateAction<string[]>>

  sortBy: ExtendedFindParamsSortBy | undefined
  setSortBy: Dispatch<SetStateAction<ExtendedFindParamsSortBy | undefined>>

  keywords: string | undefined

  cluster: boolean
  setCluster: Dispatch<SetStateAction<boolean>>

  isLocationLoading: boolean
  setIsLocationLoading: Dispatch<SetStateAction<boolean>>

  viewMode: ViewMode
  setViewMode: Dispatch<SetStateAction<ViewMode>>

  handleClearFilters: () => void
}

const ExploreChallengesSearchContext = createContext<
  ExploreChallengesSearchContextType | undefined
>(undefined)

interface ExploreChallengesSearchContextProviderProps {
  children: ReactNode
}

const buildKeywords = (categories: string[], workOnValue: WorkOnCategory): string | undefined => {
  const allKeywords: string[] = [...categories]
  const workOnKeywords = workOnCategoryMap[workOnValue]
  if (workOnKeywords) {
    allKeywords.push(...workOnKeywords)
  }
  return allKeywords.length > 0 ? allKeywords.join(',') : undefined
}

interface PersistedFilters {
  difficulty?: DifficultyLevel
  workOn?: WorkOnCategory
  selectedCategories?: string[]
  sortBy?: ExtendedFindParamsSortBy
  global?: boolean
  locationOsmType?: string
  locationOsmId?: number
  locationBounds?: string
  viewMode?: ViewMode
  cluster?: boolean
}

const COOKIE_NAME = 'explore_challenges_filters'

export const ExploreChallengesSearchContextProvider = ({
  children,
}: ExploreChallengesSearchContextProviderProps) => {
  const {
    difficulty: initialDifficulty,
    workOn: initialWorkOn,
    categories: initialCategories,
    sortBy: initialSortBy,
    global: initialGlobal,
    osm_type: initialOsmType,
    osm_id: initialOsmId,
    viewMode: initialViewMode,
  } = useSearch({ from: '/_app/' })

  const persistedFilters = getJSONCookie<PersistedFilters>(COOKIE_NAME)

  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialDifficulty ?? persistedFilters?.difficulty ?? 'Any'
  )
  const [workOn, setWorkOn] = useState<WorkOnCategory>(
    initialWorkOn ?? persistedFilters?.workOn ?? 'Anything'
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategories
      ? initialCategories.split(',').filter(Boolean)
      : (persistedFilters?.selectedCategories ?? [])
  )
  const [sortBy, setSortBy] = useState<ExtendedFindParamsSortBy | undefined>(
    initialSortBy ?? persistedFilters?.sortBy
  )
  const [cluster, setCluster] = useState<boolean>(persistedFilters?.cluster ?? true)
  const [viewMode, setViewMode] = useState<ViewMode>(
    (initialViewMode as ViewMode) ?? persistedFilters?.viewMode ?? 'grid-map'
  )

  const [bounds, setBounds] = useState(DEFAULT_WORLD_BOUNDS)
  const [zoom, setZoom] = useState(2)
  const [locationOsmType, setLocationOsmType] = useState<string | undefined>(
    initialOsmType ?? persistedFilters?.locationOsmType
  )
  const [locationOsmId, setLocationOsmId] = useState<number | undefined>(
    initialOsmId ?? persistedFilters?.locationOsmId
  )
  // Bounding box of the place picked in the location filter. Kept separate
  // from `bounds` (the map viewport) because the viewport is overwritten on
  // every map move, which would otherwise widen the results back out.
  const [locationBounds, setLocationBounds] = useState<string | undefined>(() => {
    // A place supplied in the URL wins over the cookie, and its bbox isn't
    // known until Nominatim resolves it, so don't seed a mismatched one.
    const urlPlaceDiffers =
      (initialOsmType !== undefined || initialOsmId !== undefined) &&
      (initialOsmType !== persistedFilters?.locationOsmType ||
        initialOsmId !== persistedFilters?.locationOsmId)
    return urlPlaceDiffers ? undefined : persistedFilters?.locationBounds
  })
  // The place's real boundary, once Nominatim has returned one. Until then --
  // and for places it has no polygon for -- the bbox above stands in.
  const [resolvedPlaceFilter, setResolvedPlaceFilter] = useState<PlaceFilter | null>(null)
  const setLocationOsm = useCallback((osmType: string | undefined, osmId: number | undefined) => {
    setLocationOsmType(osmType)
    setLocationOsmId(osmId)
    if (osmType === undefined || osmId === undefined) {
      setLocationBounds(undefined)
      setResolvedPlaceFilter(null)
    }
  }, [])
  const [global, setGlobal] = useState<boolean | undefined>(
    initialGlobal ?? persistedFilters?.global
  )

  const isInitialUrlSync = useRef(true)
  const isInitialCookiePersist = useRef(true)

  useEffect(() => {
    if (!persistedFilters) return

    if (initialDifficulty === undefined && persistedFilters.difficulty) {
      setDifficulty(persistedFilters.difficulty)
    }
    if (initialWorkOn === undefined && persistedFilters.workOn) {
      setWorkOn(persistedFilters.workOn)
    }
    if (initialCategories === undefined && persistedFilters.selectedCategories) {
      setSelectedCategories(persistedFilters.selectedCategories)
    }
    if (initialSortBy === undefined && persistedFilters.sortBy) {
      setSortBy(persistedFilters.sortBy)
    }
    if (initialGlobal === undefined && persistedFilters.global !== undefined) {
      setGlobal(persistedFilters.global)
    }
    if (
      initialOsmType === undefined &&
      initialOsmId === undefined &&
      persistedFilters.locationOsmType !== undefined &&
      persistedFilters.locationOsmId !== undefined
    ) {
      setLocationOsmType(persistedFilters.locationOsmType)
      setLocationOsmId(persistedFilters.locationOsmId)
    }
    if (initialViewMode === undefined && persistedFilters.viewMode) {
      setViewMode(persistedFilters.viewMode)
    }
    if (persistedFilters.cluster !== undefined) {
      setCluster(persistedFilters.cluster)
    }
  }, [])

  useEffect(() => {
    if (isInitialUrlSync.current) {
      isInitialUrlSync.current = false
      return
    }

    if (initialDifficulty !== undefined) {
      setDifficulty(initialDifficulty)
    }
    if (initialWorkOn !== undefined) {
      setWorkOn(initialWorkOn)
    }
    if (initialCategories !== undefined) {
      setSelectedCategories(initialCategories.split(',').filter(Boolean))
    }
    if (initialSortBy !== undefined) {
      setSortBy(initialSortBy as ExtendedFindParamsSortBy)
    }
    if (initialGlobal !== undefined) {
      setGlobal(initialGlobal)
    }
    if (initialOsmType !== undefined || initialOsmId !== undefined) {
      setLocationOsmType(initialOsmType)
      setLocationOsmId(initialOsmId)
    }
    if (initialViewMode !== undefined) {
      setViewMode(initialViewMode as ViewMode)
    }
  }, [
    initialDifficulty,
    initialWorkOn,
    initialCategories,
    initialSortBy,
    initialGlobal,
    initialOsmType,
    initialOsmId,
    initialViewMode,
  ])
  const keywords = useMemo(
    () => buildKeywords(selectedCategories, workOn),
    [selectedCategories, workOn]
  )
  const [isLocationLoading, setIsLocationLoading] = useState(false)

  const [locationGeojson, setLocationGeojson] = useState<LocationGeojson>(null)
  const [pendingFitBounds, setPendingFitBounds] = useState<string | null>(null)

  // All useCallback/useMemo hooks below are stored in the context value — stable references
  // prevent all context consumers from re-rendering on every provider render.
  const clearPendingFitBounds = useCallback(() => {
    setPendingFitBounds(null)
  }, [])

  const requestFitBounds = useCallback((boundsToFit: string) => {
    setPendingFitBounds(boundsToFit)
  }, [])

  // A challenge has to have a task that is both in view and inside the place.
  // The box sent is the viewport narrowed to the place's own box, and the
  // place's exact boundary rides along as geometry below -- so results stay
  // bounded by the place even against a server too old to accept the boundary.
  const viewportBounds = viewMode === 'grid-map' ? clampBoundsString(bounds) : DEFAULT_WORLD_BOUNDS
  const placeIntersection = locationBounds
    ? intersectBoundsStrings(viewportBounds, locationBounds)
    : viewportBounds
  // Nothing overlaps: no box expresses that, so the query is skipped instead.
  const hasEmptyPlaceIntersection = placeIntersection === null
  const effectiveBounds = placeIntersection ?? viewportBounds

  const bboxPlaceFilter = useMemo<PlaceFilter | null>(() => {
    if (!locationBounds) return null
    const polygon = boundsStringToPolygon(locationBounds)
    return polygon ? { key: `bbox:${locationBounds}`, geometryJson: JSON.stringify(polygon) } : null
  }, [locationBounds])

  const placeFilter = resolvedPlaceFilter ?? bboxPlaceFilter

  const searchParams = useMemo<ExploreChallengesRequest>(
    () => ({
      bounds: effectiveBounds,
      keywords: buildKeywords(selectedCategories, workOn),
      difficulty: difficultyMap[difficulty],
      // Sent explicitly: the toggle renders unset as off, so leaving the
      // param out and inheriting a server-side default would contradict it.
      global: global ?? false,
      placeGeometryJson: placeFilter?.geometryJson,
      placeKey: placeFilter?.key,
    }),
    [effectiveBounds, selectedCategories, workOn, difficulty, global, placeFilter]
  )

  const extendedFindParams = useMemo<ExploreChallengesRequest>(
    () => ({
      ...searchParams,
      sortBy: sortBy as ExtendedFindParamsSortBy,
      limit: 10,
    }),
    [searchParams, sortBy]
  )

  const taskTilesParams = useMemo<TaskTilesParams>(
    () => ({
      z: zoom,
      bounds: effectiveBounds,
      keywords: buildKeywords(selectedCategories, workOn),
      difficulty: difficultyMap[difficulty],
      global: global ?? false,
    }),
    [zoom, effectiveBounds, selectedCategories, workOn, difficulty, global]
  )

  useEffect(() => {
    if (isInitialCookiePersist.current) {
      isInitialCookiePersist.current = false
      return
    }

    const filtersToSave: PersistedFilters = {
      difficulty: difficulty !== 'Any' ? difficulty : undefined,
      workOn: workOn !== 'Anything' ? workOn : undefined,
      selectedCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      global: global !== undefined ? global : undefined,
      locationOsmType: locationOsmType !== undefined ? locationOsmType : undefined,
      locationOsmId: locationOsmId !== undefined ? locationOsmId : undefined,
      locationBounds,
      viewMode: viewMode !== 'grid-map' ? viewMode : undefined,
      cluster: cluster !== true ? cluster : undefined,
    }

    const hasFilters = Object.values(filtersToSave).some((value) => value !== undefined)
    if (hasFilters) {
      setJSONCookie(COOKIE_NAME, filtersToSave)
    } else {
      removeCookie(COOKIE_NAME)
    }
  }, [
    difficulty,
    workOn,
    selectedCategories,
    sortBy,
    global,
    locationOsmType,
    locationOsmId,
    locationBounds,
    viewMode,
    cluster,
  ])

  const handleClearFilters = useCallback(() => {
    setBounds(DEFAULT_WORLD_BOUNDS)
    setLocationOsmType(undefined)
    setLocationOsmId(undefined)
    setLocationBounds(undefined)
    setResolvedPlaceFilter(null)
    setGlobal(undefined)
    setDifficulty('Any')
    setWorkOn('Anything')
    setSelectedCategories([])
    setLocationGeojson(null)
    setPendingFitBounds(null)

    removeCookie(COOKIE_NAME)
  }, [])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<ExploreChallengesSearchContextType>(
    () => ({
      extendedFindParams,
      taskTilesParams,
      bounds,
      setBounds,
      zoom,
      setZoom,
      locationOsmType,
      locationOsmId,
      setLocationOsm,
      locationBounds,
      setLocationBounds,
      setResolvedPlaceFilter,
      hasEmptyPlaceIntersection,
      global,
      setGlobal,
      locationGeojson,
      setLocationGeojson,
      pendingFitBounds,
      clearPendingFitBounds,
      requestFitBounds,
      difficulty,
      setDifficulty,
      workOn,
      setWorkOn,
      selectedCategories,
      setSelectedCategories,
      sortBy,
      setSortBy,
      cluster,
      setCluster,
      isLocationLoading,
      setIsLocationLoading,
      keywords,
      viewMode,
      setViewMode,
      handleClearFilters,
    }),
    [
      extendedFindParams,
      taskTilesParams,
      bounds,
      zoom,
      locationOsmType,
      locationOsmId,
      setLocationOsm,
      locationBounds,
      hasEmptyPlaceIntersection,
      global,
      locationGeojson,
      pendingFitBounds,
      clearPendingFitBounds,
      requestFitBounds,
      difficulty,
      workOn,
      selectedCategories,
      sortBy,
      cluster,
      isLocationLoading,
      keywords,
      viewMode,
      handleClearFilters,
    ]
  )

  return (
    <ExploreChallengesSearchContext.Provider value={value}>
      {children}
    </ExploreChallengesSearchContext.Provider>
  )
}

export const useExploreChallengesSearchContext = () => {
  const context = useContext(ExploreChallengesSearchContext)
  if (context === undefined) {
    throw new Error(
      'useExploreChallengesSearchContext must be used within an ExploreChallengesSearchContextProvider'
    )
  }
  return context
}
