import { describe, expect, it } from 'vitest'
import type { SessionHistoryItem, TaskHistoryAction } from '@/types/Task'
import { mergeHistoryFeeds } from './taskHistoryFeed'

const log = (timestamp: string, actionType: number): TaskHistoryAction => ({
  taskId: 1,
  timestamp,
  actionType,
  user: { id: 1, username: 'alice' },
})

const session = (
  created: string,
  event: SessionHistoryItem['event'],
  id: number
): SessionHistoryItem => ({
  id,
  created,
  user: { id: 1, username: 'alice' },
  taskId: 1,
  lockId: 9,
  event,
  sessionType: 'Map',
  subType: null,
})

describe('mergeHistoryFeeds', () => {
  it('orders lock, status, and unlock by timestamp', () => {
    const merged = mergeHistoryFeeds(
      [log('2026-09-01T12:00:05.000Z', 1)],
      [
        session('2026-09-01T12:00:00.000Z', 'lock', 1),
        session('2026-09-01T12:00:10.000Z', 'unlock', 2),
      ]
    )

    expect(merged.map((entry) => entry.kind)).toEqual(['session', 'log', 'session'])
    expect(merged[0]?.kind === 'session' && merged[0].item.event).toBe('lock')
    expect(merged[2]?.kind === 'session' && merged[2].item.event).toBe('unlock')
  })

  it('places a lock before an unlock when timestamps match', () => {
    const stamp = '2026-09-01T12:00:00.000Z'
    const merged = mergeHistoryFeeds([], [session(stamp, 'unlock', 2), session(stamp, 'lock', 1)])
    expect(
      merged.map((entry) => (entry.kind === 'session' ? entry.item.event : entry.kind))
    ).toEqual(['lock', 'unlock'])
  })
})
