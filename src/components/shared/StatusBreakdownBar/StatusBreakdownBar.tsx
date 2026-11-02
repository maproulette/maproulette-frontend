import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { useIntl } from '@/i18n'
import { type ActionCounts, useActionSummary } from './useActionSummary'

interface Props {
  /** Raw per-status action counts (e.g. from `challengeStats.actions`). */
  actions: ActionCounts | undefined
  height?: number
}

export const StatusBreakdownBar = ({ actions, height = 10 }: Props) => {
  const { t, formatNumber } = useIntl()
  const { total, completed, segments } = useActionSummary(actions)

  if (total === 0 || segments.length === 0) {
    return (
      <div
        role="img"
        aria-label={t({ id: 'statusBreakdownBar.bar.noTasks', defaultMessage: 'No tasks yet' })}
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
      aria-label={t({ id: 'statusBreakdownBar.bar.label', defaultMessage: 'Status breakdown' })}
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
              {segment.label}: {formatNumber(segment.count)} (
              {formatNumber(segment.percent / 100, {
                style: 'percent',
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              )
            </span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
