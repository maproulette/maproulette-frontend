import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '@/api'
import { coordInBbox, parseBoundsString } from '@/components/Map/mapUtils'
import { processMarkersData } from '@/components/Map/TaskMarkers/utils'
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
  statusEnabled: Record<number, boolean>
  setStatusChecked: (s: number, checked: boolean) => void
  priorityEnabled: Record<number, boolean>
  setPriorityChecked: (p: number, checked: boolean) => void
  sortField: SortField
  setSortField: (f: SortField) => void
  sortDesc: boolean
  setSortDesc: React.Dispatch<React.SetStateAction<boolean>>
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
  enabled,
  children,
}: {
  challengeId: number
  enabled: boolean
  children: ReactNode
}) => {
  const [statusEnabled, setStatusEnabled] = useState(() =>
    initialEnabledRecord(DEFAULT_TASK_STATUS_FILTER)
  )
  const [priorityEnabled, setPriorityEnabled] = useState(() =>
    initialEnabledRecord(DEFAULT_PRIORITY_FILTER)
  )
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortDesc, setSortDesc] = useState(true)
  const [viewportBounds, setViewportBoundsRaw] = useState<Bbox2D | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskMarker | null>(null)

  const setViewportBounds = useCallback((boundsStr: string) => {
    setViewportBoundsRaw(parseBoundsString(boundsStr))
  }, [])

  const { data: taskMarkersData, isLoading } = api.challenge.getChallengeTaskMarkers(challengeId)

  const markers = useMemo(() => processMarkersData(taskMarkersData).markers, [taskMarkersData])

  // Markers passed to the map: filtered by status/priority only (not viewport,
  // to avoid a feedback loop where panning the map hides tasks that would then
  // no longer be in bounds on the next pan).
  const mapMarkers = useMemo(
    () => markers.filter((m) => statusEnabled[m.status]).filter((m) => priorityEnabled[m.priority]),
    [markers, statusEnabled, priorityEnabled]
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
    setStatusEnabled(initialEnabledRecord(DEFAULT_TASK_STATUS_FILTER))
    setPriorityEnabled(initialEnabledRecord(DEFAULT_PRIORITY_FILTER))
    setSortField('id')
    setSortDesc(true)
  }, [])

  const filtersDirty =
    DEFAULT_TASK_STATUS_FILTER.some((s) => !statusEnabled[s]) ||
    DEFAULT_PRIORITY_FILTER.some((p) => !priorityEnabled[p]) ||
    sortField !== 'id' ||
    sortDesc !== true

  const value = useMemo(
    (): ExplorerContextValue => ({
      enabled,
      challengeId,
      statusEnabled,
      setStatusChecked,
      priorityEnabled,
      setPriorityChecked,
      sortField,
      setSortField,
      sortDesc,
      setSortDesc,
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
      statusEnabled,
      priorityEnabled,
      sortField,
      sortDesc,
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
