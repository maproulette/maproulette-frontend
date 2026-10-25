import { Progress } from '@/components/ui/Progress'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'

export interface ChallengeStatusInfo {
  status?: string
  creatingTasks?: number
  deletingTasks?: number
  totalTasks?: number
}

const busyStatuses = new Set(['Building', 'Deleting', 'Rebuilding', 'Updating', 'Archiving'])

interface Props {
  info: ChallengeStatusInfo | undefined
}

export const ChallengeStatusBanner = ({ info }: Props) => {
  const { t } = useIntl()
  if (!info?.status || !busyStatuses.has(info.status)) return null

  const current = info.creatingTasks ?? info.deletingTasks ?? 0
  const total = info.totalTasks ?? 0
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0

  return (
    <output
      aria-live="polite"
      className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40"
    >
      <Spinner className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <div className="flex-1">
        <div className="font-medium">
          {t(
            'managementPages.challengeStatusBanner.tasksInProgress',
            { status: info.status },
            '{status} tasks…'
          )}
        </div>
        {total > 0 && (
          <div className="text-xs text-zinc-600 dark:text-slate-400">
            {current.toLocaleString()} / {total.toLocaleString()}
          </div>
        )}
        <Progress value={percent} className="mt-1 h-1" />
      </div>
    </output>
  )
}
