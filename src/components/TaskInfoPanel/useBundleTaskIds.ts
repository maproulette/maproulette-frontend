import { api } from '@/api'
import { useOptionalTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import type { Task } from '@/types/Task'

/**
 * Every task being worked on alongside the given one: the task itself first,
 * then the rest of its bundle. In the task editor the live (possibly unsaved)
 * bundle wins; elsewhere — and for a task that isn't the one being edited —
 * this falls back to the bundle the task itself belongs to.
 */
export const useBundleTaskIds = (task: Task): number[] => {
  const bundleContext = useOptionalTaskBundleContext()
  const activeBundleIds = bundleContext?.activeBundle?.taskIds ?? []
  const isInActiveBundle = activeBundleIds.includes(task.id)

  const { data: savedBundle } = api.taskBundle.getTaskBundle(
    isInActiveBundle ? 0 : (task.bundleId ?? 0)
  )

  const bundleIds = isInActiveBundle ? activeBundleIds : (savedBundle?.taskIds ?? [])

  return [task.id, ...bundleIds.filter((id) => id !== task.id)]
}
