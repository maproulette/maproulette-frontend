import { TemplatedInstructions } from './TemplatedInstructions'

interface InstructionPanelProps {
  taskInstruction?: string
}

export const InstructionPanel = ({ taskInstruction }: InstructionPanelProps) => {
  if (!taskInstruction) return null

  return (
    <div>
      <TemplatedInstructions instructions={taskInstruction} />
    </div>
  )
}
