import { Lock, Unlock } from 'lucide-react'
import { useIntl } from '@/i18n'
import { formatDate, formatDateTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { SessionHistoryItem } from '@/types/Task'

const SESSION_TINT: Record<string, string> = {
  lock: 'from-amber-100/80 dark:from-amber-900/30',
  unlock: 'from-zinc-100/80 dark:from-zinc-800/30',
}

const SESSION_BAR: Record<string, string> = {
  lock: 'bg-amber-500',
  unlock: 'bg-zinc-400',
}

export const SessionHistoryItemRow = ({ item }: { item: SessionHistoryItem }) => {
  const { t } = useIntl()
  const timestamp = new Date(item.created)
  const userName =
    item.user?.username ?? t('taskInfoPanel.comments.systemUser', undefined, 'System')
  const isLock = item.event === 'lock'
  const Icon = isLock ? Lock : Unlock
  const tint = SESSION_TINT[item.event] ?? SESSION_TINT.unlock
  const bar = SESSION_BAR[item.event] ?? SESSION_BAR.unlock

  const actionLabel = (() => {
    if (item.sessionType === 'Map') {
      return isLock
        ? t('taskInfoPanel.sessionHistory.lockedForMapping', undefined, 'locked for mapping')
        : t('taskInfoPanel.sessionHistory.unlockedMapping', undefined, 'unlocked mapping session')
    }
    if (item.subType) {
      return isLock
        ? t(
            'taskInfoPanel.sessionHistory.lockedCustom',
            { subType: item.subType },
            'locked ({subType})'
          )
        : t(
            'taskInfoPanel.sessionHistory.unlockedCustom',
            { subType: item.subType },
            'unlocked ({subType})'
          )
    }
    return isLock
      ? t('taskInfoPanel.sessionHistory.locked', undefined, 'locked the task')
      : t('taskInfoPanel.sessionHistory.unlocked', undefined, 'unlocked the task')
  })()

  return (
    <div
      title={formatDateTime(timestamp)}
      className={cn(
        'relative flex flex-wrap items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r to-transparent py-2 pr-3 pl-4 text-xs',
        tint
      )}
    >
      <div className={cn('absolute top-0 bottom-0 left-0 w-1', bar)} />
      <Icon className="size-3 text-zinc-500 dark:text-slate-400" aria-hidden="true" />
      <span className="font-medium text-zinc-700 dark:text-slate-200">{userName}</span>
      <span className="text-zinc-500 dark:text-slate-400">{actionLabel}</span>
      <span className="ml-auto text-zinc-400 dark:text-slate-500">{formatDate(timestamp)}</span>
    </div>
  )
}
