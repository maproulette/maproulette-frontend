import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useOptionalTaskEditMapContext } from '@/components/Pages/TaskEditPage/TaskMap/TaskEditMapContext'
import { substituteTaskProperties } from '@/components/TaskInfoPanel/taskUtils/propertyUtils'
import type { Task } from '@/types/Task'
import { BundleStateIndicator } from './BundleStateIndicator'
import { BundleTaskList } from './BundleTaskList'
import { InstructionPanel } from './InstructionPanel'
import { TagFixPanel } from './TagFixPanel'
import { YourEditsPanel } from './YourEditsPanel'

interface TaskTabProps {
  task: Task
}

export const TaskTab = ({ task }: TaskTabProps) => {
  const { challenge } = useChallengeContext()
  const taskMap = useOptionalTaskEditMapContext()
  const { task: primaryTask } = useTaskContext()
  const {
    activeBundle,
    bundleEditsDisabled,
    viewedTaskId,
    viewedTaskBundleTaskIds,
    canAddSelectedMarkerToBundle,
    handleAddToBundle,
    handleRemoveFromBundle,
    setDrawerTaskId,
  } = useTaskBundleContext()

  const isPrimaryTask = task.id === primaryTask.id
  // Whether this TaskTab instance is showing the task currently displayed in
  // the drawer (as opposed to the always-rendered primary task tab).
  const isViewedTask = task.id === viewedTaskId
  const isInBundle = activeBundle?.taskIds.includes(task.id) ?? false
  const canRemoveFromBundle = isInBundle && !isPrimaryTask && !bundleEditsDisabled
  const canAddToBundle = isViewedTask && canAddSelectedMarkerToBundle
  const nonPrimaryBundleTaskIds = isViewedTask
    ? viewedTaskBundleTaskIds
    : (activeBundle?.taskIds.filter((id) => id !== primaryTask.id) ?? [])
  const allBundleTaskIds =
    nonPrimaryBundleTaskIds.length > 0 ? [primaryTask.id, ...nonPrimaryBundleTaskIds] : []

  return (
    <div className="space-y-4">
      <BundleTaskList
        taskIds={allBundleTaskIds}
        primaryTaskId={primaryTask.id}
        onOpenBundleTask={isPrimaryTask ? setDrawerTaskId : undefined}
      />

      <BundleStateIndicator
        canAddToBundle={canAddToBundle}
        canRemoveFromBundle={canRemoveFromBundle}
        isInBundle={isInBundle}
        isPrimaryTask={isPrimaryTask}
        onAddToBundle={handleAddToBundle}
        onRemoveFromBundle={handleRemoveFromBundle}
      />

      <TagFixPanel task={task} />

      <YourEditsPanel />

      <InstructionPanel
        taskInstruction={
          challenge?.instruction
            ? substituteTaskProperties(challenge.instruction, task, {
                bounds: taskMap?.mapBounds,
                zoom: taskMap?.mapZoom,
              })
            : undefined
        }
      />
    </div>
  )
}
