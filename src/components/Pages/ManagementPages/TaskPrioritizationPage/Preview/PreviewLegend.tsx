import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { PRIORITY_COLOR, PRIORITY_MESSAGES, PRIORITY_TIERS } from '@/types/Priority'

export const PreviewLegend = ({ className }: { className?: string }) => {
  const { t } = useIntl()
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-md border border-line bg-popover px-3 py-1.5 text-xs shadow-md',
        className
      )}
    >
      {PRIORITY_TIERS.map((p) => (
        <span key={p} className="flex items-center gap-1.5 text-fg">
          <span className={cn('size-2.5 rounded-full', PRIORITY_COLOR[p].bg)} />
          {t(PRIORITY_MESSAGES[p])}
        </span>
      ))}
    </div>
  )
}
