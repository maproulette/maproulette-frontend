import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { isTaskEligibleForBundle } from '@/components/Map/TaskMarkers/utils'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'
import { useIntl } from '@/i18n'
import type { Task, TaskMarker } from '@/types/Task'

/** Sentinel for a locally-built bundle that hasn't been persisted yet. */
export const PENDING_BUNDLE_ID = 0

/** Canonicalizes a set of task IDs for order-independent comparison. */
const sortedIdKey = (ids: number[]) =>
  ids
    .slice()
    .sort((a, b) => a - b)
    .join(',')

export interface TaskBundle {
  bundleId: number
  taskIds: number[]
  tasks?: Task[]
  name: string
}

export interface TaskBundleContextType {
  activeBundle: TaskBundle | null
  setActiveBundle: Dispatch<SetStateAction<TaskBundle | null>>
  initialBundle: TaskBundle | null
  showBundleOnly: boolean
  setShowBundleOnly: Dispatch<SetStateAction<boolean>>
  bundleEditsDisabled: boolean
  setBundleEditsDisabled: Dispatch<SetStateAction<boolean>>
  bundlingDisabledReason: string | null
  setBundlingDisabledReason: Dispatch<SetStateAction<string | null>>
  visibleTaskIds: number[] | null
  setVisibleTaskIds: Dispatch<SetStateAction<number[] | null>>
  clearBundle: () => void
  resetBundle: () => void
  showDeleteDialog: boolean
  setShowDeleteDialog: Dispatch<SetStateAction<boolean>>
  handleClearBundle: () => void

  // Drawer / selection state for the task currently being viewed (either a
  // bundle member opened from the bundle list, or a non-bundle marker
  // selected on the map). Derived here — rather than in TaskPanel — so that
  // TaskTab (and any other consumer) can read it directly via
  // useTaskBundleContext() instead of receiving it as prop-drilled state.
  drawerTaskId: number | null
  setDrawerTaskId: Dispatch<SetStateAction<number | null>>
  drawerOpen: boolean
  viewedTaskId: number
  viewedTask: Task
  /** Non-primary task IDs belonging to the viewed task's bundle. */
  viewedTaskBundleTaskIds: number[]
  isViewedTaskInBundle: boolean
  /** Whether the currently selected (non-bundle) map marker can be added to the active bundle. */
  canAddSelectedMarkerToBundle: boolean
  handleAddToBundle: () => void
  handleRemoveFromBundle: () => void
  /** Updates the live lock to cover the given bundle's member tasks (or none, if null) -
   * for edits made outside these handlers, e.g. the lasso-select workflow in
   * useLassoBundleSync. Never touches the persisted task_bundles record; that only
   * happens when the task is actually submitted (see TaskActionModal). */
  persistBundle: (nextBundle: TaskBundle | null) => void
}

const TaskBundleContext = createContext<TaskBundleContextType | undefined>(undefined)

export const TaskBundleProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useIntl()
  const { task, isLocked, lockedTasks } = useTaskContext()
  const { user } = useAuthContext()
  const { selectedMarker, setSelectedMarker, setActiveTaskId, emptyClickCount } =
    useTaskMapContext()

  const [activeBundle, setActiveBundle] = useState<TaskBundle | null>(null)
  const [showBundleOnly, setShowBundleOnly] = useState(false)
  const [bundleEditsDisabled, setBundleEditsDisabled] = useState(false)
  const [bundlingDisabledReason, setBundlingDisabledReason] = useState<string | null>(null)
  const [visibleTaskIds, setVisibleTaskIds] = useState<number[] | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null)

  const lockBundleMutation = api.task.useLockTaskBundle()

  const persistBundle = useCallback(
    (nextBundle: TaskBundle | null) => {
      const memberTaskIds = nextBundle?.taskIds.filter((id) => id !== task.id) ?? []
      lockBundleMutation.mutate({ taskId: task.id, taskIds: memberTaskIds })
    },
    [task.id, lockBundleMutation.mutate]
  )

  const { data: dbBundle } = api.taskBundle.getTaskBundle(task.bundleId ?? 0)
  const dbBundleTaskIds = useMemo(
    () => dbBundle?.taskIds.filter((id) => id !== task.id) ?? [],
    [dbBundle, task.id]
  )

  const initialBundle: TaskBundle | null = useMemo(
    () =>
      dbBundleTaskIds.length === 0
        ? null
        : {
            bundleId: dbBundle?.bundleId ?? PENDING_BUNDLE_ID,
            taskIds: [task.id, ...dbBundleTaskIds],
            name: 'Bundle',
          },
    [dbBundleTaskIds, task.id, dbBundle?.bundleId]
  )

  // Reason: stable references returned from context — consumers use these as event handler dependencies
  const clearBundle = useCallback(() => {
    setActiveBundle(null)
    // Note: Don't clear initialBundle - it should persist based on the primary task's original bundle
    setShowBundleOnly(false)
    setVisibleTaskIds(null)
  }, [])

  const resetBundle = useCallback(() => {
    if (initialBundle) {
      setActiveBundle(initialBundle)
    }
  }, [initialBundle])

  const handleClearBundle = useCallback(() => {
    if (!activeBundle) return
    // Release the lock's bundled tasks too - otherwise other tabs would still see them as
    // locked/bundled even though this tab has moved on to just the primary.
    persistBundle(null)
    clearBundle()
    toast.success(
      t('taskEditPage.taskBundle.clearedSuccess', undefined, 'Now working on only the primary task')
    )
    setShowDeleteDialog(false)
  }, [activeBundle, clearBundle, persistBundle])

  const bundleTaskIds = activeBundle?.taskIds ?? [task.id]
  const isNonBundleSelection = selectedMarker !== null && !bundleTaskIds.includes(selectedMarker.id)

  // The logical task the drawer should show
  const targetTaskId = isNonBundleSelection
    ? (selectedMarker?.id ?? task.id)
    : (drawerTaskId ?? task.id)
  const shouldBeOpen = drawerTaskId !== null || isNonBundleSelection

  const drawerOpen = useDrawerTransition(shouldBeOpen, targetTaskId)
  const viewedTaskId = targetTaskId

  // Fetch the viewed task data (skip if it's the primary task)
  const { data: fetchedTask } = api.task.getTask(viewedTaskId !== task.id ? viewedTaskId : 0)
  const viewedTask: Task = viewedTaskId === task.id ? task : (fetchedTask ?? task)

  const confirmedBundleTaskIds = useMemo(
    () => (isLocked ? lockedTasks : dbBundleTaskIds),
    [isLocked, lockedTasks, dbBundleTaskIds]
  )

  const viewedTaskBundleTaskIds = useMemo(() => {
    const isViewedTaskConfirmed =
      viewedTaskId === task.id || confirmedBundleTaskIds.includes(viewedTaskId)
    return isViewedTaskConfirmed ? confirmedBundleTaskIds.filter((id) => id !== viewedTaskId) : []
  }, [viewedTaskId, task.id, confirmedBundleTaskIds])

  const isViewedTaskInBundle = activeBundle?.taskIds.includes(viewedTaskId) ?? false

  // Check if the selected marker is eligible for bundling
  const isSelectedMarkerEligible =
    selectedMarker !== null &&
    isTaskEligibleForBundle(
      {
        status: selectedMarker.status,
        bundleId: selectedMarker.bundleId ?? null,
        lockedBy: selectedMarker.lockedBy ?? null,
      },
      task.bundleId ?? null,
      user?.id ?? null
    )

  const canAddSelectedMarkerToBundle =
    isNonBundleSelection && !bundleEditsDisabled && isSelectedMarkerEligible

  // When the bundle changes, close drawer if task is no longer in bundle
  useEffect(() => {
    if (drawerTaskId !== null && !bundleTaskIds.includes(drawerTaskId)) {
      setDrawerTaskId(null)
    }
  }, [bundleTaskIds, drawerTaskId])

  // When a bundle task is clicked on the map, open it in the drawer
  useEffect(() => {
    if (
      selectedMarker &&
      bundleTaskIds.includes(selectedMarker.id) &&
      selectedMarker.id !== task.id
    ) {
      setDrawerTaskId(selectedMarker.id)
      setSelectedMarker(null)
    }
  }, [selectedMarker, bundleTaskIds, setSelectedMarker, task.id])

  // Keep the map's active task ID in sync
  useEffect(() => {
    setActiveTaskId(viewedTaskId)
  }, [viewedTaskId, setActiveTaskId])

  // When empty space on map is clicked, close drawer
  useEffect(() => {
    if (emptyClickCount > 0) {
      setDrawerTaskId(null)
      setSelectedMarker(null)
    }
  }, [emptyClickCount, setSelectedMarker])

  useEffect(() => {
    setActiveBundle(null)
  }, [task.id])

  useEffect(() => {
    const confirmedKey = sortedIdKey(confirmedBundleTaskIds)
    const activeKey = sortedIdKey(activeBundle?.taskIds.filter((id) => id !== task.id) ?? [])
    if (confirmedKey === activeKey) return

    if (confirmedBundleTaskIds.length === 0) {
      setActiveBundle(null)
      return
    }

    setActiveBundle({
      bundleId: task.bundleId ?? PENDING_BUNDLE_ID,
      taskIds: [task.id, ...confirmedBundleTaskIds],
      name: 'Bundle',
    })
  }, [confirmedBundleTaskIds, task.id, task.bundleId])

  // Reason: stable references returned from context — consumers use these as event handler dependencies
  const handleAddToBundle = useCallback(() => {
    if (bundleEditsDisabled || !selectedMarker) return

    let newBundle: TaskBundle
    if (!activeBundle) {
      newBundle = {
        bundleId: PENDING_BUNDLE_ID,
        taskIds: [task.id, selectedMarker.id],
        tasks: [task],
        name: `Bundle (pending)`,
      }
      setActiveBundle(newBundle)
    } else {
      if (activeBundle.taskIds.includes(selectedMarker.id)) return
      newBundle = {
        ...activeBundle,
        taskIds: [...activeBundle.taskIds, selectedMarker.id],
        tasks: activeBundle.tasks,
      }
      setActiveBundle(newBundle)
    }

    persistBundle(newBundle)

    // Move the newly added task into the drawer as a bundle task
    const addedId = selectedMarker.id
    setSelectedMarker(null)
    setDrawerTaskId(addedId)
  }, [bundleEditsDisabled, selectedMarker, activeBundle, task, setSelectedMarker, persistBundle])

  const handleRemoveFromBundle = useCallback(() => {
    if (bundleEditsDisabled || !activeBundle) return
    if (viewedTaskId === task.id) return

    const removedTaskId = viewedTaskId
    const removedTask = viewedTask

    const updatedTaskIds = activeBundle.taskIds.filter((id) => id !== removedTaskId)

    if (updatedTaskIds.length <= 1) {
      persistBundle(null)
      setActiveBundle(null)
    } else {
      const newBundle: TaskBundle = {
        ...activeBundle,
        taskIds: updatedTaskIds,
        tasks: activeBundle.tasks,
      }
      setActiveBundle(newBundle)
      persistBundle(newBundle)
    }

    // Show removed task as non-bundle selection in drawer.
    // Task.location is a GeoJSON Point ([lng, lat]); TaskMarker.location is { lat, lng }.
    const [lng, lat] = removedTask.location.coordinates
    const removedTaskMarker: TaskMarker = {
      id: removedTaskId,
      location: { lng, lat },
      status: removedTask.status ?? 0,
      priority: removedTask.priority ?? 0,
    }
    setSelectedMarker(removedTaskMarker)
    setDrawerTaskId(null)
  }, [
    bundleEditsDisabled,
    activeBundle,
    viewedTaskId,
    task.id,
    viewedTask,
    setSelectedMarker,
    persistBundle,
  ])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value: TaskBundleContextType = useMemo(
    () => ({
      activeBundle,
      setActiveBundle,
      initialBundle,
      showBundleOnly,
      setShowBundleOnly,
      bundleEditsDisabled,
      setBundleEditsDisabled,
      bundlingDisabledReason,
      setBundlingDisabledReason,
      visibleTaskIds,
      setVisibleTaskIds,
      clearBundle,
      resetBundle,
      showDeleteDialog,
      setShowDeleteDialog,
      handleClearBundle,
      drawerTaskId,
      setDrawerTaskId,
      drawerOpen,
      viewedTaskId,
      viewedTask,
      viewedTaskBundleTaskIds,
      isViewedTaskInBundle,
      canAddSelectedMarkerToBundle,
      handleAddToBundle,
      handleRemoveFromBundle,
      persistBundle,
    }),
    [
      activeBundle,
      initialBundle,
      showBundleOnly,
      bundleEditsDisabled,
      bundlingDisabledReason,
      visibleTaskIds,
      clearBundle,
      resetBundle,
      showDeleteDialog,
      handleClearBundle,
      drawerTaskId,
      drawerOpen,
      viewedTaskId,
      viewedTask,
      viewedTaskBundleTaskIds,
      isViewedTaskInBundle,
      canAddSelectedMarkerToBundle,
      handleAddToBundle,
      handleRemoveFromBundle,
      persistBundle,
    ]
  )

  return <TaskBundleContext.Provider value={value}>{children}</TaskBundleContext.Provider>
}

export const useTaskBundleContext = () => {
  const context = useContext(TaskBundleContext)
  if (context === undefined) {
    throw new Error('useTaskBundleContext must be used within a TaskBundleProvider')
  }
  return context
}
