import type { TranslateFn } from '@/i18n'
import type { UserContribution } from '@/types/User'

/** Action type the backend records when a user sets a task's status. */
const ACTION_TASK_STATUS_SET = 4

export interface ActivityDay {
  date: string
  challenges: {
    name: string
    parentId: number
    actions: { status: number; count: number }[]
  }[]
}

interface DateBucket {
  timestamp: number
  label: string
  challenges: Map<number, Map<number, number>>
}

/**
 * Groups a user's recent status changes by day, then challenge, then status,
 * most recent day first (skipping actions that aren't task status change)
 */
export const aggregateActivity = (
  activityData: UserContribution[] | undefined,
  t: TranslateFn,
  locale: string
): ActivityDay[] => {
  if (!activityData) return []

  const dateMap = new Map<string, DateBucket>()
  const challengeNames = new Map<number, string>()
  const currentYear = new Date().getFullYear()

  for (const { action, created, parentId, parentName, status } of activityData) {
    if (action !== ACTION_TASK_STATUS_SET || !created || parentId === undefined) continue

    const date = new Date(created)
    const year = date.getFullYear()
    const dateKey = `${year}-${date.getMonth()}-${date.getDate()}`

    if (parentName) challengeNames.set(parentId, parentName)

    if (!dateMap.has(dateKey)) {
      const label = date.toLocaleDateString(
        locale,
        year === currentYear
          ? { month: 'long', day: 'numeric' }
          : { month: 'long', day: 'numeric', year: 'numeric' }
      )
      dateMap.set(dateKey, {
        timestamp: new Date(year, date.getMonth(), date.getDate()).getTime(),
        label,
        challenges: new Map(),
      })
    }
    const challengeMap = (dateMap.get(dateKey) as DateBucket).challenges

    if (!challengeMap.has(parentId)) {
      challengeMap.set(parentId, new Map())
    }
    const statusMap = challengeMap.get(parentId) as Map<number, number>

    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  }

  const sortedDates = Array.from(dateMap.values()).sort((a, b) => b.timestamp - a.timestamp)

  return sortedDates.map(({ label, challenges: challengeMap }) => ({
    date: label,
    challenges: Array.from(challengeMap, ([parentId, statusMap]) => ({
      name:
        challengeNames.get(parentId) ||
        t(
          {
            id: 'dashboard.activity.unknownChallenge',
            defaultMessage: 'Challenge {parentId}',
          },
          { parentId }
        ),
      parentId,
      actions: Array.from(statusMap, ([status, count]) => ({ status, count })).sort(
        (a, b) => a.status - b.status
      ),
    })),
  }))
}
