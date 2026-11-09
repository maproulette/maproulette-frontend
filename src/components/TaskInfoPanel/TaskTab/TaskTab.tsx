import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import { useOptionalTaskEditMapContext } from '@/components/Pages/TaskEditPage/TaskMap/TaskEditMapContext'
import { substituteMarkdownTaskProperties } from '@/components/TaskInfoPanel/taskUtils/propertyUtils'
import type { Task } from '@/types/Task'
import { EditorChangesPanel } from './EditorChangesPanel'
import { InstructionPanel } from './InstructionPanel'

interface TaskTabProps {
  task: Task
}

export const TaskTab = ({ task }: TaskTabProps) => {
  const { challenge } = useChallengeContext()
  const taskMap = useOptionalTaskEditMapContext()
  const instruction = task.instruction || challenge?.instruction
  return (
    <div className="space-y-4">
      <EditorChangesPanel task={task} />

      <InstructionPanel
        taskInstruction={
          instruction
            ? substituteMarkdownTaskProperties(instruction, task, {
                bounds: taskMap?.mapBounds,
                zoom: taskMap?.mapZoom,
              })
            : undefined
        }
      />
    </div>
  )
}
