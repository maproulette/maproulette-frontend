import { useOptionalTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useOptionalTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import type { Task } from '@/types/Task'
import { BundleStateIndicator } from './TaskTab/BundleStateIndicator'

interface BundleActionsProps {
  /** The task the surrounding panel is showing. */
  task: Task
}

/**
 * Whether the given task can join or leave the bundle being worked on, and the
 * button for doing it. Sits at the bottom of the task's header, since it acts
 * on the task as a whole rather than on anything inside one tab.
 *
 * Nothing is shown for the primary task — it cannot leave its own bundle, so
 * there is no action to offer — nor outside the task editor, where there is no
 * bundle to act on.
 */
export const BundleActions = ({ task }: BundleActionsProps) => {
  const bundleContext = useOptionalTaskBundleContext()
  const taskContext = useOptionalTaskContext()
  const primaryTask = taskContext?.task

  if (!bundleContext || !primaryTask) return null

  const {
    activeBundle,
    bundleEditsDisabled,
    viewedTaskId,
    canAddSelectedMarkerToBundle,
    handleAddToBundle,
    handleRemoveFromBundle,
  } = bundleContext

  if (task.id === primaryTask.id) return null

  // Whether this is the task currently displayed in the drawer, as opposed to
  // the always-rendered primary task panel.
  const isViewedTask = task.id === viewedTaskId
  const isInBundle = activeBundle?.taskIds.includes(task.id) ?? false

  return (
    <BundleStateIndicator
      canAddToBundle={isViewedTask && canAddSelectedMarkerToBundle}
      canRemoveFromBundle={isInBundle && !bundleEditsDisabled}
      isInBundle={isInBundle}
      onAddToBundle={handleAddToBundle}
      onRemoveFromBundle={handleRemoveFromBundle}
    />
  )
}
