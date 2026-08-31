import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { useIntl } from '@/i18n'
import { type ActionCounts, useActionSummary } from './useActionSummary'

interface Props {
  /** Raw per-status action counts (e.g. from `challengeStats.actions`). */
  actions: ActionCounts | undefined
  height?: number
}

export const StatusBreakdownBar = ({ actions, height = 10 }: Props) => {
  const { t } = useIntl()
  const { total, completed, segments } = useActionSummary(actions)

  if (total === 0 || segments.length === 0) {
    return (
      <div
        role="img"
        aria-label={t('statusBreakdownBar.bar.noTasks', undefined, 'No tasks yet')}
        className="w-full rounded-full bg-zinc-200 dark:bg-slate-700"
        style={{ height }}
      />
    )
  }

  return (
    <div
      className="flex w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-slate-700"
      style={{ height }}
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={t('statusBreakdownBar.bar.label', undefined, 'Status breakdown')}
    >
      {segments.map((segment) => (
        <Tooltip key={segment.key}>
          <TooltipTrigger asChild>
            <span
              aria-hidden="true"
              style={{ backgroundColor: segment.color, width: `${segment.percent}%` }}
              className="h-full"
            />
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-xs">
              {segment.label}: {segment.count.toLocaleString()} ({segment.percent.toFixed(1)}%)
            </span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
