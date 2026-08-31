import { api } from '@/api'
import type { ProgressSegment } from '@/components/shared/ProgressBar'
import { useAuthContext } from '@/contexts/AuthContext'
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

const STATUS_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  falsePositive: 'Not an Issue',
  alreadyFixed: 'Already Fixed',
  validated: 'Validated',
  answered: 'Answered',
  deleted: 'Deleted',
  disabled: 'Disabled',
  tooHard: "Can't Complete",
  skipped: 'Skipped',
  available: 'Created',
}

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
// individual counts are present, which used to hide the progress bar entirely).
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

export const useChallengeProgress = (challengeId: number, fallback?: CompletionMetrics) => {
  const { isAuthenticated } = useAuthContext()
  // /api/v2/data/challenge/:id requires auth; skip it for logged-out users and
  // fall back to the listing-provided metrics instead of a doomed 401 request.
  const { data: challengeStatsData } = api.challenge.getChallengeStats(challengeId, isAuthenticated)
  // Prefer per-challenge stats when loaded; otherwise use the listing-provided
  // metrics so list views show segmented bars without waiting on per-card
  // requests. Both shapes share the same per-status field names.
  const counts: Partial<Record<(typeof ALL_STATUS_FIELDS)[number] | 'total', number>> | undefined =
    challengeStatsData?.[0]?.actions ?? fallback

  const summedTotal = counts
    ? ALL_STATUS_FIELDS.reduce((acc, field) => acc + (counts[field] ?? 0), 0)
    : 0
  const total = counts?.total && counts.total > 0 ? counts.total : summedTotal

  const completionPercentage = (() => {
    if (total === 0 || !counts) return 0
    const completed = (counts.fixed || 0) + (counts.falsePositive || 0) + (counts.alreadyFixed || 0)
    return Math.round((completed / total) * 100)
  })()

  const buildSegments = (): ProgressSegment[] => {
    if (total === 0 || !counts) return []

    const completed: ProgressSegment[] = []
    const remaining: ProgressSegment[] = []

    for (const status of COMPLETED_STATUSES) {
      const count = counts[status]
      if (count && count > 0) {
        completed.push({
          key: status,
          percentage: (count / total) * 100,
          // COMPLETED_STATUSES are all backed by a STATUS_COLORS entry; fallback is unreachable.
          /* v8 ignore next -- @preserve */
          color: STATUS_COLORS[status] || '#9ca3af',
          title: `${STATUS_LABELS[status]}: ${count}`,
        })
      }
    }

    const tooHardCount = counts[PROBLEM_STATUS] ?? 0
    if (tooHardCount > 0) {
      remaining.push({
        key: PROBLEM_STATUS,
        percentage: (tooHardCount / total) * 100,
        color: PROBLEM_STYLE.color,
        title: `${STATUS_LABELS[PROBLEM_STATUS]}: ${tooHardCount}`,
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
        title: `Remaining: ${total - Math.round(((completedSum + tooHardPercent) / 100) * total)}`,
        opacity: REMAINING_FILL_STYLE.opacity,
      })
    }

    return [...completed, ...remaining]
  }

  const segments = buildSegments()
  const hasActions = !!counts && total > 0

  const tasksRemaining = (counts?.available ?? 0) + (counts?.skipped ?? 0) + (counts?.tooHard ?? 0)

  return { completionPercentage, segments, hasActions, total, tasksRemaining }
}
