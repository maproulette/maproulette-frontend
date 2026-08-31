import { MarkdownContent } from '@/components/shared/MarkdownContent'

interface InstructionPanelProps {
  taskInstruction?: string
}

export const InstructionPanel = ({ taskInstruction }: InstructionPanelProps) => {
  if (!taskInstruction) return null

  return (
    <div>
      <MarkdownContent>{taskInstruction}</MarkdownContent>
    </div>
  )
}
