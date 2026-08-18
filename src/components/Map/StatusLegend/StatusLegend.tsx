import { ChevronDown, ChevronUp, MapIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { LegendRow } from './LegendRow'
import { getStatusLegendEntries, priorityEntries } from './taskStatusCatalog'

interface Props {
  defaultOpen?: boolean
}

export const StatusLegend = ({ defaultOpen = false }: Props) => {
  const [open, setOpen] = useState(defaultOpen)
  const { t } = useIntl()
  const statusLegendEntries = getStatusLegendEntries(t)

  return (
    <div className="rounded-md bg-white/95 shadow-md backdrop-blur dark:bg-slate-900/95">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="flex w-full items-center justify-between gap-2 px-2 py-1 text-xs"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <MapIcon className="size-3.5" aria-hidden="true" />{' '}
          {t('statusLegend.legend', undefined, 'Legend')}
        </span>
        {open ? (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronUp className="size-3.5" aria-hidden="true" />
        )}
      </Button>
      {open && (
        <div className="space-y-2 border-zinc-200 border-t p-2 dark:border-slate-700">
          <div>
            <div className="mb-1 text-[10px] text-zinc-500 uppercase tracking-wide dark:text-slate-400">
              {t('common.status', undefined, 'Status')}
            </div>
            <ul className="space-y-1">
              {statusLegendEntries.map((entry) => (
                <LegendRow
                  key={entry.status}
                  variant="status"
                  color={entry.color}
                  icon={entry.icon}
                  label={entry.label}
                />
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[10px] text-zinc-500 uppercase tracking-wide dark:text-slate-400">
              {t('common.priority', undefined, 'Priority')}
            </div>
            <ul className="space-y-1">
              {priorityEntries.map((entry) => (
                <LegendRow
                  key={entry.priority}
                  variant="priority"
                  color={entry.color}
                  label={entry.label}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
