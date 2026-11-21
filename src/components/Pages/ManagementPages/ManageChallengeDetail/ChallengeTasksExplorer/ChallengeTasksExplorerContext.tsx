import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { challengeTaskMarkersOptions } from '@/api/challenge'
import { taskIdsMatchingPropertiesOptions } from '@/api/task'
import { coordInBbox, parseBoundsString } from '@/components/Map/mapUtils'
import { flattenTaskMarkers } from '@/components/Map/TaskMarkers/utils'
import type { BinaryNode } from '@/components/shared/TaskPropertyQueryBuilder/propertyRuleTypes'
import { binaryToTaskPropertySearch } from '@/components/shared/TaskPropertyQueryBuilder/taskPropertySearch'
import { DEFAULT_PRIORITY_FILTER, DEFAULT_TASK_STATUS_FILTER } from '@/lib/challengeTaskTableSearch'
import type { Bbox2D } from '@/types/Map'
import type { TaskMarker } from '@/types/Task'
import type { SortField } from './constants'

const initialEnabledRecord = <T extends readonly number[]>(values: T): Record<number, boolean> => {
  return Object.fromEntries(values.map((v) => [v, true]))
}

const markerInBounds = (m: TaskMarker, bbox: Bbox2D): boolean => {
  if (!m.location) return false
  return coordInBbox([m.location.lng, m.location.lat], bbox)
}

/** Sorts task markers by the given field, ascending or descending, without mutating the input. */
export const sortTaskMarkers = (
  markers: TaskMarker[],
  sortField: SortField,
  sortDesc: boolean
): TaskMarker[] => {
  return [...markers].sort((a, b) => {
    let cmp = 0
    if (sortField === 'id') cmp = a.id - b.id
    else if (sortField === 'status') cmp = a.status - b.status
    else if (sortField === 'priority') cmp = a.priority - b.priority
    return sortDesc ? -cmp : cmp
  })
}

type Sort = { field: SortField; desc: boolean }

const DEFAULT_SORT: Sort = { field: 'id', desc: true }

/**
 * The sort after clicking `field`'s column header: ascending, then descending,
 * then back to the default. The default (id descending) counts as unsorted, so
 * clicking ID from there goes to ascending rather than "resetting" in place.
 */
export const nextSort = (current: Sort, field: SortField): Sort => {
  const isDefault = current.field === DEFAULT_SORT.field && current.desc === DEFAULT_SORT.desc
  if (isDefault || current.field !== field) return { field, desc: false }
  if (!current.desc) return { field, desc: true }
  return DEFAULT_SORT
}

/**
 * Toggles whether `key` is enabled within a filter's enabled-state record, refusing to
 * disable the last remaining enabled value out of `allValues` (at least one must stay on).
 */
export const toggleFilterWithMinimumOne = <T extends readonly number[]>(
  prev: Record<number, boolean>,
  allValues: T,
  key: number,
  checked: boolean
): Record<number, boolean> => {
  const countOn = allValues.filter((x) => prev[x]).length
  if (!checked && countOn <= 1) return prev
  return { ...prev, [key]: checked }
}

type ExplorerContextValue = {
  enabled: boolean
  challengeId: number
  challengeName?: string | null
  statusEnabled: Record<number, boolean>
  setStatusChecked: (s: number, checked: boolean) => void
  priorityEnabled: Record<number, boolean>
  setPriorityChecked: (p: number, checked: boolean) => void
  propertyRule: BinaryNode | null
  setPropertyRule: (rule: BinaryNode | null) => void
  propertyFilterActive: boolean
  propertyMatchesLoading: boolean
  sortField: SortField
  sortDesc: boolean
  /** Advances `field`'s header-click sort cycle (see `nextSort`). */
  cycleSort: (field: SortField) => void
  clearFilters: () => void
  filtersDirty: boolean
  markers: TaskMarker[]
  mapMarkers: TaskMarker[]
  filteredMarkers: TaskMarker[]
  isLoading: boolean
  setViewportBounds: (bounds: string) => void
  selectedTask: TaskMarker | null
  setSelectedTask: (task: TaskMarker | null) => void
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null)

export const useExplorerContext = () => {
  const ctx = useContext(ExplorerContext)
  if (!ctx) {
    throw new Error('Challenge tasks explorer components must be used within the provider')
  }
  return ctx
}

export const ChallengeTasksExplorerProvider = ({
  challengeId,
  challengeName,
  enabled,
  children,
}: {
  challengeId: number
  challengeName?: string | null
  enabled: boolean
  children: ReactNode
}) => {
  const [statusEnabled, setStatusEnabled] = useState(() =>
    initialEnabledRecord(DEFAULT_TASK_STATUS_FILTER)
  )
  const [priorityEnabled, setPriorityEnabled] = useState(() =>
    initialEnabledRecord(DEFAULT_PRIORITY_FILTER)
  )
  const [propertyRule, setPropertyRule] = useState<BinaryNode | null>(null)
  const [sortField, setSortField] = useState<SortField>(DEFAULT_SORT.field)
  const [sortDesc, setSortDesc] = useState(DEFAULT_SORT.desc)
  const [viewportBounds, setViewportBoundsRaw] = useState<Bbox2D | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskMarker | null>(null)

  const setViewportBounds = useCallback((boundsStr: string) => {
    setViewportBoundsRaw(parseBoundsString(boundsStr))
  }, [])

  const { data: taskMarkersData, isLoading } = useQuery(challengeTaskMarkersOptions(challengeId))

  // Feature properties live server-side, so the property rule is resolved to a
  // set of matching task ids and intersected with the markers below.
  const taskPropertySearch = useMemo(() => binaryToTaskPropertySearch(propertyRule), [propertyRule])
  const { data: propertyMatches, isFetching: propertyMatchesLoading } = useQuery({
    ...taskIdsMatchingPropertiesOptions(challengeId, taskPropertySearch),
    enabled: enabled && !!taskPropertySearch,
  })
  const propertyFilterActive = !!taskPropertySearch

  const markers = useMemo(() => flattenTaskMarkers(taskMarkersData), [taskMarkersData])

  // Markers passed to the map: filtered by status/priority only (not viewport,
  // to avoid a feedback loop where panning the map hides tasks that would then
  // no longer be in bounds on the next pan).
  const mapMarkers = useMemo(
    () =>
      markers
        .filter((m) => statusEnabled[m.status])
        .filter((m) => priorityEnabled[m.priority])
        // While the matches are still loading, show nothing rather than the
        // unfiltered list, so the table never briefly contradicts the filter.
        .filter((m) => !propertyFilterActive || !!propertyMatches?.has(m.id)),
    [markers, statusEnabled, priorityEnabled, propertyFilterActive, propertyMatches]
  )

  const filteredMarkers = useMemo(() => {
    const filtered = mapMarkers.filter((m) => !viewportBounds || markerInBounds(m, viewportBounds))
    return sortTaskMarkers(filtered, sortField, sortDesc)
  }, [mapMarkers, sortField, sortDesc, viewportBounds])

  const setStatusChecked = useCallback((s: number, checked: boolean) => {
    setStatusEnabled((prev) =>
      toggleFilterWithMinimumOne(prev, DEFAULT_TASK_STATUS_FILTER, s, checked)
    )
  }, [])

  const setPriorityChecked = useCallback((p: number, checked: boolean) => {
    setPriorityEnabled((prev) =>
      toggleFilterWithMinimumOne(prev, DEFAULT_PRIORITY_FILTER, p, checked)
    )
  }, [])

  const clearFilters = useCallback(() => {
    setPropertyRule(null)
    setStatusEnabled(initialEnabledRecord(DEFAULT_TASK_STATUS_FILTER))
    setPriorityEnabled(initialEnabledRecord(DEFAULT_PRIORITY_FILTER))
  }, [])

  const cycleSort = useCallback(
    (field: SortField) => {
      const next = nextSort({ field: sortField, desc: sortDesc }, field)
      setSortField(next.field)
      setSortDesc(next.desc)
    },
    [sortField, sortDesc]
  )

  const filtersDirty =
    DEFAULT_TASK_STATUS_FILTER.some((s) => !statusEnabled[s]) ||
    DEFAULT_PRIORITY_FILTER.some((p) => !priorityEnabled[p]) ||
    propertyFilterActive

  const value = useMemo(
    (): ExplorerContextValue => ({
      enabled,
      challengeId,
      challengeName,
      statusEnabled,
      setStatusChecked,
      priorityEnabled,
      setPriorityChecked,
      propertyRule,
      setPropertyRule,
      propertyFilterActive,
      propertyMatchesLoading,
      sortField,
      sortDesc,
      cycleSort,
      clearFilters,
      filtersDirty,
      markers,
      mapMarkers,
      filteredMarkers,
      isLoading,
      setViewportBounds,
      selectedTask,
      setSelectedTask,
    }),
    [
      enabled,
      challengeId,
      challengeName,
      statusEnabled,
      priorityEnabled,
      propertyRule,
      propertyFilterActive,
      propertyMatchesLoading,
      sortField,
      sortDesc,
      cycleSort,
      clearFilters,
      filtersDirty,
      markers,
      mapMarkers,
      filteredMarkers,
      isLoading,
      setStatusChecked,
      setPriorityChecked,
      setViewportBounds,
      selectedTask,
    ]
  )

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>
}
