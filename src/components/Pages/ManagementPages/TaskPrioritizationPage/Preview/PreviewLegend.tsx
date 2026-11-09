import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { PRIORITY_COLOR, PRIORITY_MESSAGES, PRIORITY_TIERS } from '@/types/Priority'

export const PreviewLegend = ({ className }: { className?: string }) => {
  const { t } = useIntl()
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-md border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90',
        className
      )}
    >
      {PRIORITY_TIERS.map((p) => (
        <span key={p} className="flex items-center gap-1.5 text-zinc-700 dark:text-slate-200">
          <span className={cn('size-2.5 rounded-full', PRIORITY_COLOR[p].bg)} />
          {t(PRIORITY_MESSAGES[p])}
        </span>
      ))}
    </div>
  )
}
