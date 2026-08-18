import { useEffect } from 'react'
import { api } from '@/api'
import {
  PENDING_BUNDLE_ID,
  type TaskBundle,
  useTaskBundleContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import {
  MAX_SELECTED_TASKS,
  useTaskMapContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'

export const useLassoBundleSync = () => {
  const { selectedTaskIds, clearSelection } = useTaskMapContext()
  const { activeBundle, setActiveBundle, persistBundle } = useTaskBundleContext()
  const { task } = useTaskContext()
  const primaryTaskId = task.id
  const { data: primaryTaskData } = api.task.getTask(primaryTaskId)

  useEffect(() => {
    if (selectedTaskIds.size === 0) return

    const selectedArray = Array.from(selectedTaskIds)
    let newBundle: TaskBundle | null = null

    if (!activeBundle) {
      // Create new bundle with primary task and selected tasks
      const newTaskIds = [primaryTaskId, ...selectedArray].slice(0, MAX_SELECTED_TASKS)
      newBundle = {
        bundleId: PENDING_BUNDLE_ID,
        taskIds: newTaskIds,
        tasks: primaryTaskData ? [primaryTaskData] : [],
        name: 'Bundle (pending)',
      }
    } else {
      // Add to existing bundle
      const newTaskIds = selectedArray.filter((id) => !activeBundle.taskIds.includes(id))
      if (newTaskIds.length > 0) {
        const updatedTaskIds = [...activeBundle.taskIds, ...newTaskIds].slice(0, MAX_SELECTED_TASKS)
        newBundle = {
          ...activeBundle,
          taskIds: updatedTaskIds,
          tasks: activeBundle.tasks,
        }
      }
    }

    if (newBundle) {
      setActiveBundle(newBundle)
      persistBundle(newBundle)
    }

    // Clear selection after adding to bundle
    clearSelection()
  }, [
    selectedTaskIds,
    activeBundle,
    setActiveBundle,
    persistBundle,
    clearSelection,
    primaryTaskId,
    primaryTaskData,
  ])
}
