import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import { useOptionalTaskEditMapContext } from '@/components/Pages/TaskEditPage/TaskMap/TaskEditMapContext'
import { substituteTaskProperties } from '@/components/TaskInfoPanel/taskUtils/propertyUtils'
import type { Task } from '@/types/Task'
import { EditorChangesPanel } from './EditorChangesPanel'
import { InstructionPanel } from './InstructionPanel'

interface TaskTabProps {
  task: Task
}

export const TaskTab = ({ task }: TaskTabProps) => {
  const { challenge } = useChallengeContext()
  const taskMap = useOptionalTaskEditMapContext()
  return (
    <div className="space-y-4">
      <EditorChangesPanel task={task} />

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
