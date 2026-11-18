import { defineMessages } from 'react-intl'
import { getVisibleTotal } from '@/hooks/useChallengeProgress'
import { useIntl } from '@/i18n'
import { STATUS_COLOR, STATUS_KEY_TO_ID } from '@/lib/taskConstants'

/**
 * Task status counts as sent by the backend. This mirrors the shape of both
 * `ChallengeStatsResponse[number]['actions']` and `CompletionMetrics`; all
 * fields are optional so we can accept either.
 */
export type ActionCounts = {
  available?: number
  fixed?: number
  falsePositive?: number
  skipped?: number
  alreadyFixed?: number
  tooHard?: number
  answered?: number
  validated?: number
}

/* Statuses for the challenge progress bar, in order. */
const STATUS_ORDER = ['fixed', 'alreadyFixed', 'falsePositive', 'tooHard', 'available'] as const

type StatusKey = (typeof STATUS_ORDER)[number]

const statusMessages = defineMessages({
  fixed: { id: 'common.fixed', defaultMessage: 'Fixed' },
  alreadyFixed: { id: 'statusBreakdownBar.status.alreadyFixed', defaultMessage: 'Already fixed' },
  falsePositive: { id: 'common.notAnIssue', defaultMessage: 'Not an Issue' },
  tooHard: { id: 'common.cantComplete', defaultMessage: "Can't Complete" },
  available: { id: 'common.available', defaultMessage: 'Available' },
})

interface ActionSummarySegment {
  key: StatusKey
  label: string
  color: string
  count: number
  percent: number
}

export interface ActionSummary {
  total: number
  /** Tasks that are fixed, already fixed or not an issue. */
  completed: number
  /** Non-zero segments, ordered by STATUS_ORDER. */
  segments: ActionSummarySegment[]
}

const countOf = (value: number | undefined): number =>
  typeof value === 'number' && value > 0 ? value : 0

/**
 * Per-status counts and percentages for a challenge.
 */
export const useActionSummary = (actions: ActionCounts | undefined): ActionSummary => {
  const { t } = useIntl()

  if (!actions) return { total: 0, completed: 0, segments: [] }

  const counts: Record<StatusKey, number> = {
    fixed: countOf(actions.fixed),
    alreadyFixed: countOf(actions.alreadyFixed),
    falsePositive: countOf(actions.falsePositive),
    tooHard: countOf(actions.tooHard),
    available: countOf(actions.available) + countOf(actions.skipped),
  }
  const total = getVisibleTotal(actions)

  const segments = STATUS_ORDER.filter((key) => counts[key] > 0).map((key) => ({
    key,
    label: t(statusMessages[key]),
    color: STATUS_COLOR[STATUS_KEY_TO_ID[key === 'available' ? 'created' : key]],
    count: counts[key],
    percent: total > 0 ? (counts[key] / total) * 100 : 0,
  }))

  return { total, completed: counts.fixed + counts.alreadyFixed + counts.falsePositive, segments }
}
