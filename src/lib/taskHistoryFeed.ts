import type { SessionHistoryItem, TaskHistoryAction } from '@/types/Task'

export type HistoryFeedEntry =
  | { kind: 'log'; timestamp: string; item: TaskHistoryAction }
  | { kind: 'session'; timestamp: string; item: SessionHistoryItem }

const time = (value: string): number => {
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : 0
}

/**
 * Merge comments/status history with lock/unlock session events
 * into a single chronological feed.
 */
export const mergeHistoryFeeds = (
  log: TaskHistoryAction[],
  sessions: SessionHistoryItem[]
): HistoryFeedEntry[] => {
  const entries: HistoryFeedEntry[] = [
    ...log.map((item) => ({ kind: 'log' as const, timestamp: item.timestamp, item })),
    ...sessions.map((item) => ({ kind: 'session' as const, timestamp: item.created, item })),
  ]

  return entries.sort((a, b) => {
    const dt = time(a.timestamp) - time(b.timestamp)
    if (dt !== 0) return dt
    if (a.kind === 'session' && b.kind === 'session') {
      if (a.item.event !== b.item.event) {
        return a.item.event === 'lock' ? -1 : 1
      }
      return a.item.id - b.item.id
    }
    return a.kind === 'session' && a.item.event === 'lock' ? -1 : 0
  })
}
