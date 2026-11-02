import { useId } from 'react'
import { useIntl } from '@/i18n'
import { ReviewerStatsBlock } from '../blocks/ReviewerStatsBlock'
import { ReviewStatsBlock } from '../blocks/ReviewStatsBlock'
import { TaskStatsBlock } from '../blocks/TaskStatsBlock'
import { TimeRangeSelector } from '../TimeRangeSelector'

export const MetricsSection = () => {
  const { t } = useIntl()
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="font-semibold text-lg text-zinc-900 dark:text-slate-100">
          {t({ id: 'profilePage.metrics.title', defaultMessage: 'Metrics' })}
        </h2>
        <TimeRangeSelector />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TaskStatsBlock />
        <ReviewStatsBlock />
        <ReviewerStatsBlock />
      </div>
    </section>
  )
}
