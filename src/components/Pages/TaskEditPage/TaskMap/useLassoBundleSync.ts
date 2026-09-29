import { useEffect } from 'react'
import { toast } from 'sonner'
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
import { useIntl } from '@/i18n'

export const useLassoBundleSync = () => {
  const { selectedTaskIds, clearSelection } = useTaskMapContext()
  const { t } = useIntl()
  const { activeBundle, setActiveBundle, lockBundleTasks } = useTaskBundleContext()
  const { task, isLocked } = useTaskContext()
  const primaryTaskId = task.id
  const { data: primaryTaskData } = api.task.getTask(primaryTaskId)

  useEffect(() => {
    if (selectedTaskIds.size === 0) return
    // A bundle hangs off the primary task's lock, so there is nothing to add to
    // until it is held.
    if (!isLocked) {
      clearSelection()
      return
    }

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
      const bundle = newBundle
      // Members join the bundle only once the lock actually covers them.
      lockBundleTasks(bundle)
        .then(() => setActiveBundle(bundle))
        .catch(() => {
          toast.error(
            t(
              'taskEditPage.taskBundle.addFailed',
              undefined,
              'Could not lock that task, so it was not added to the bundle.'
            )
          )
        })
    }

    // Clear selection after adding to bundle
    clearSelection()
  }, [
    selectedTaskIds,
    activeBundle,
    setActiveBundle,
    lockBundleTasks,
    clearSelection,
    isLocked,
    t,
    primaryTaskId,
    primaryTaskData,
  ])
}
