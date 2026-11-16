import { Badge } from '@/components/ui/Badge'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { PRIORITY_COLOR, type TaskPriorityValue } from '@/types/Priority'
import { useTaskPreview } from '../TaskPreviewContext'

export const TierMatchCount = ({
  priority,
  className,
}: {
  priority: TaskPriorityValue
  className?: string
}) => {
  const { formatNumber } = useIntl()
  const { preview } = useTaskPreview()
  const count = preview.counts[priority]
  return (
    <Badge variant="secondary" className={cn('gap-1.5 font-mono', className)}>
      <span className={cn('size-2 rounded-full', PRIORITY_COLOR[priority].bg)} />
      {formatNumber(count)}
    </Badge>
  )
}
