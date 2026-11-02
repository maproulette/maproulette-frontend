import { defineMessage, defineMessages, type MessageDescriptor } from 'react-intl'
import type { ProgressSegment } from '@/components/shared/ProgressBar'
import { useIntl } from '@/i18n'
import { STATUS_HEX, STATUS_KEY_TO_ID } from '@/lib/taskConstants'
import type { CompletionMetrics } from '@/types/Challenge'

// Every key this is called with below is a hardcoded, valid STATUS_KEY_TO_ID entry, so the
// `?? -1` / `?? '#9ca3af'` fallbacks can never actually trigger.
/* v8 ignore next -- @preserve */
const colorForKey = (key: string): string => STATUS_HEX[STATUS_KEY_TO_ID[key] ?? -1] ?? '#9ca3af'

const STATUS_COLORS: Record<string, string> = {
  fixed: colorForKey('fixed'),
  falsePositive: colorForKey('falsePositive'),
  skipped: colorForKey('skipped'),
  deleted: colorForKey('deleted'),
  alreadyFixed: colorForKey('alreadyFixed'),
  tooHard: colorForKey('tooHard'),
  available: colorForKey('available'),
  validated: colorForKey('validated'),
  answered: colorForKey('answered'),
  disabled: colorForKey('disabled'),
}

const SEGMENT_MESSAGES: Record<string, MessageDescriptor> = defineMessages({
  fixed: { id: 'common.fixed', defaultMessage: 'Fixed' },
  falsePositive: { id: 'common.notAnIssue', defaultMessage: 'Not an Issue' },
  alreadyFixed: { id: 'common.alreadyFixed', defaultMessage: 'Already Fixed' },
  tooHard: { id: 'common.cantComplete', defaultMessage: "Can't Complete" },
  remaining: { id: 'challengeProgress.remaining', defaultMessage: 'Remaining' },
})

const SEGMENT_TITLE: MessageDescriptor = defineMessage({
  id: 'challengeProgress.segmentTitle',
  defaultMessage: '{status}: {count, number}',
})

// Left side: completed statuses (count toward completion %)
const COMPLETED_STATUSES = ['fixed', 'falsePositive', 'alreadyFixed'] as const

// `tooHard` is a problem state, not just unworked, so it gets its own red tint.
// Everything else non-completed (skipped, available, deleted, disabled, etc.)
// collapses into a single gray fill segment so the bar reads like a normal
// progress bar with no background bleed-through between distinct grays.
const PROBLEM_STATUS = 'tooHard' as const
const PROBLEM_STYLE = { color: '#ef4444', opacity: 0.55 }
const REMAINING_FILL_STYLE = { color: '#9ca3af', opacity: 0.45 }

// All per-status fields the backend reports; used to derive a total when
// `actions.total` is missing or zero (the backend sometimes omits it even when
// individual metrics are present, which used to hide the progress bar entirely).
const ALL_STATUS_FIELDS = [
  'fixed',
  'falsePositive',
  'alreadyFixed',
  'skipped',
  'tooHard',
  'available',
  'deleted',
  'disabled',
  'answered',
  'validated',
] as const

const getTotal = (metrics?: CompletionMetrics) => {
  const summedTotal = metrics
    ? ALL_STATUS_FIELDS.reduce((acc, field) => acc + (metrics[field] ?? 0), 0)
    : 0
  return metrics?.total && metrics.total > 0 ? metrics.total : summedTotal
}

const getCompletionPercentage = (metrics?: CompletionMetrics) => {
  const total = getTotal(metrics)
  if (total === 0 || !metrics) return 0
  const completed =
    (metrics.fixed || 0) + (metrics.falsePositive || 0) + (metrics.alreadyFixed || 0)
  return Math.round((completed / total) * 100)
}

export const useChallengeProgress = (metrics?: CompletionMetrics) => {
  const { t } = useIntl()
  const total = getTotal(metrics)
  const completionPercentage = getCompletionPercentage(metrics)

  const buildSegments = (): ProgressSegment[] => {
    if (total === 0 || !metrics) return []

    const completed: ProgressSegment[] = []
    const remaining: ProgressSegment[] = []

    for (const status of COMPLETED_STATUSES) {
      const count = metrics[status]
      if (count && count > 0) {
        completed.push({
          key: status,
          percentage: (count / total) * 100,
          // COMPLETED_STATUSES are all backed by a STATUS_COLORS entry; fallback is unreachable.
          /* v8 ignore next -- @preserve */
          color: STATUS_COLORS[status] || '#9ca3af',
          title: t(SEGMENT_TITLE, { status: t(SEGMENT_MESSAGES[status]), count }),
        })
      }
    }

    const tooHardCount = metrics[PROBLEM_STATUS] ?? 0
    if (tooHardCount > 0) {
      remaining.push({
        key: PROBLEM_STATUS,
        percentage: (tooHardCount / total) * 100,
        color: PROBLEM_STYLE.color,
        title: t(SEGMENT_TITLE, { status: t(SEGMENT_MESSAGES[PROBLEM_STATUS]), count: tooHardCount }),
        opacity: PROBLEM_STYLE.opacity,
      })
    }

    // Single gray fill for everything else so the bar always reaches 100% width
    // without the container background showing through as a second gray shade.
    const completedSum = completed.reduce((acc, s) => acc + s.percentage, 0)
    const tooHardPercent = remaining.reduce((acc, s) => acc + s.percentage, 0)
    const fillPercent = Math.max(0, 100 - completedSum - tooHardPercent)
    if (fillPercent > 0) {
      remaining.push({
        key: 'remaining',
        percentage: fillPercent,
        color: REMAINING_FILL_STYLE.color,
        title: t(SEGMENT_TITLE, {
          status: t(SEGMENT_MESSAGES.remaining),
          count: total - Math.round(((completedSum + tooHardPercent) / 100) * total),
        }),
        opacity: REMAINING_FILL_STYLE.opacity,
      })
    }

    return [...completed, ...remaining]
  }

  const segments = buildSegments()
  const hasActions = !!metrics && total > 0

  const tasksRemaining =
    (metrics?.available ?? 0) + (metrics?.skipped ?? 0) + (metrics?.tooHard ?? 0)

  return { completionPercentage, segments, hasActions, total, tasksRemaining }
}
