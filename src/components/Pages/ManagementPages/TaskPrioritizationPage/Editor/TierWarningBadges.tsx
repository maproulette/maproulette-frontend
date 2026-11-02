import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { TaskPriorityValue } from '@/types/Priority'
import { useTaskPreview } from '../TaskPreviewContext'

export const TierWarningBadges = ({
  priority,
  className,
}: {
  priority: TaskPriorityValue
  className?: string
}) => {
  const { t } = useIntl()
  const { preview } = useTaskPreview()
  const warnings = preview.warnings.tier[priority]
  if (warnings.length === 0) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {warnings.map((w) => (
        <Badge
          key={w.kind}
          variant="outline"
          className="gap-1 text-amber-700 dark:text-amber-400"
          title={t(w.message)}
        >
          <AlertTriangle className="size-3" />
          {w.kind === 'dead-rule'
            ? t({ id: 'taskPrioritizationPage.tierWarningBadges.noMatches', defaultMessage: 'No matches' })
            : t({ id: 'taskPrioritizationPage.tierWarningBadges.matchesAll', defaultMessage: 'Matches all' })}
        </Badge>
      ))}
    </div>
  )
}
