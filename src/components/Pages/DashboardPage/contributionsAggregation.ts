import type { TranslateFn } from '@/i18n'
import type { UserContribution } from '@/types/User'

interface GroupedActivity {
  date: string
  challenges: {
    name: string
    parentId: number
    actions: { status: number; count: number }[]
  }[]
}

export interface AggregatedContributions {
  groupedActivities: GroupedActivity[]
  totalTasks: number
}

interface DateBucket {
  timestamp: number
  label: string
  challenges: Map<number, Map<number, number>>
}

/**
 * Groups raw user activity entries by calendar day, then by challenge, then by
 * status, producing sorted totals for display in the contributions timeline.
 *
 * Dates are keyed by year-month-day so that the same month/day occurring in
 * different years (e.g. Jan 5 2024 vs Jan 5 2025) are kept in separate buckets
 * rather than being merged together.
 */
export const aggregateContributions = (
  activityData: UserContribution[] | undefined,
  t: TranslateFn,
  locale: string
): AggregatedContributions => {
  if (!activityData || activityData.length === 0) {
    return { groupedActivities: [], totalTasks: 0 }
  }

  // Group by calendar day (keyed by year so same month/day across years don't merge)
  const dateMap = new Map<string, DateBucket>()

  // Track challenge names by parentId
  const challengeNames = new Map<number, string>()

  const currentYear = new Date().getFullYear()
  let total = 0

  for (const { created, parentId, parentName, status } of activityData) {
    if (!created || parentId === undefined) continue

    const date = new Date(created)
    const year = date.getFullYear()
    const dateKey = `${year}-${date.getMonth()}-${date.getDate()}`

    if (parentName) challengeNames.set(parentId, parentName)

    if (!dateMap.has(dateKey)) {
      const label = date
        .toLocaleDateString(
          locale,
          year === currentYear
            ? { month: 'long', day: 'numeric' }
            : { month: 'long', day: 'numeric', year: 'numeric' }
        )
        .toLocaleUpperCase(locale)
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
    total++
  }

  // Convert to array format, sorted by date (most recent first)
  const grouped: GroupedActivity[] = []
  const sortedDates = Array.from(dateMap.values()).sort((a, b) => b.timestamp - a.timestamp)

  for (const { label, challenges: challengeMap } of sortedDates) {
    const challenges: GroupedActivity['challenges'] = []

    for (const [parentId, statusMap] of challengeMap) {
      const actions: { status: number; count: number }[] = []
      for (const [status, count] of statusMap) {
        actions.push({ status, count })
      }
      // Sort actions by status
      actions.sort((a, b) => a.status - b.status)

      challenges.push({
        name:
          challengeNames.get(parentId) ||
          t(
            {
              id: 'dashboard.contributions.unknownChallenge',
              defaultMessage: 'Challenge {parentId}',
            },
            { parentId }
          ),
        parentId,
        actions,
      })
    }

    grouped.push({ date: label, challenges })
  }

  return { groupedActivities: grouped, totalTasks: total }
}
