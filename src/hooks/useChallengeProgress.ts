import { defineMessage, defineMessages, type MessageDescriptor } from 'react-intl'
import type { ProgressSegment } from '@/components/shared/ProgressBar'
import { useIntl } from '@/i18n'
import { STATUS_COLOR, STATUS_KEY_TO_ID } from '@/lib/taskConstants'
import type { CompletionMetrics } from '@/types/Challenge'

const SEGMENT_MESSAGES: Record<string, MessageDescriptor> = defineMessages({
  fixed: { id: 'common.fixed', defaultMessage: 'Fixed' },
  falsePositive: { id: 'common.notAnIssue', defaultMessage: 'Not an Issue' },
  alreadyFixed: { id: 'common.alreadyFixed', defaultMessage: 'Already Fixed' },
  tooHard: { id: 'common.cantComplete', defaultMessage: "Can't Complete" },
})

const SEGMENT_TITLE: MessageDescriptor = defineMessage({
  id: 'challengeProgress.segmentTitle',
  defaultMessage: '{status}: {count, number}',
})

const SHOWN_STATUSES = ['fixed', 'alreadyFixed', 'falsePositive', 'tooHard'] as const

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
    return SHOWN_STATUSES.flatMap((status) => {
      const count = metrics[status] ?? 0
      if (count === 0) return []
      return {
        key: status,
        percentage: (count / total) * 100,
        color: STATUS_COLOR[STATUS_KEY_TO_ID[status]],
        title: t(SEGMENT_TITLE, { status: t(SEGMENT_MESSAGES[status]), count }),
      }
    })
  }

  const segments = buildSegments()
  const hasActions = !!metrics && total > 0

  const tasksRemaining =
    (metrics?.available ?? 0) + (metrics?.skipped ?? 0) + (metrics?.tooHard ?? 0)

  return { completionPercentage, segments, hasActions, total, tasksRemaining }
}
