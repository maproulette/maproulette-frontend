import { useIntl } from '@/i18n'
import { statusHexByKey, statusLabelByKey } from './statusColors'

/**
 * Raw per-status counts as they arrive from the backend. Mirrors the shape of
 * `ChallengeStatsResponse[number]['actions']` and `CompletionMetrics`, with all
 * fields optional so we can accept either.
 */
export type ActionCounts = {
  total?: number
  available?: number
  fixed?: number
  falsePositive?: number
  skipped?: number
  deleted?: number
  alreadyFixed?: number
  tooHard?: number
  answered?: number
  validated?: number
  disabled?: number
}

/** Canonical status key used by `statusColors` and the breakdown UI. */
export type StatusKey =
  | 'created'
  | 'fixed'
  | 'alreadyFixed'
  | 'falsePositive'
  | 'skipped'
  | 'tooHard'
  | 'deleted'
  | 'disabled'

/**
 * Canonical render order. Matches the "consistent status order" requirement in
 * the Progress Status Blocks feature plan.
 */
export const STATUS_ORDER: readonly StatusKey[] = [
  'created',
  'fixed',
  'alreadyFixed',
  'falsePositive',
  'skipped',
  'tooHard',
  'deleted',
  'disabled',
]

export interface ActionSummarySegment {
  key: StatusKey
  label: string
  color: string
  count: number
  percent: number
}

/** Statuses that count as "done" for completion percentages. */
export const COMPLETED_STATUS_KEYS: readonly StatusKey[] = [
  'fixed',
  'alreadyFixed',
  'falsePositive',
]

export interface ActionSummary {
  total: number
  /** Tasks in a completed status (see `COMPLETED_STATUS_KEYS`). */
  completed: number
  /** Non-zero segments, ordered by STATUS_ORDER. */
  segments: ActionSummarySegment[]
  /** Counts keyed by canonical status, zero-count entries omitted. Suitable
   * for feeding into `StatusBreakdownBar` / `StatusBreakdownLegend`. */
  counts: Partial<Record<StatusKey, number>>
}

/**
 * Normalize a single raw field into a numeric count. The API models every
 * field as optional so we coerce `undefined`/negative values to 0.
 */
const countOf = (value: number | undefined): number =>
  typeof value === 'number' && value > 0 ? value : 0

/**
 * Compute percentages + ordered groups from raw per-status counts.
 *
 * - `available` is mapped to the canonical key `created` to match
 *   `statusColors.ts` (which uses MR3's historical "created" naming).
 * - Zero-count statuses are omitted from `segments` and `counts`.
 * - `total` is taken from `actions.total` when present, otherwise summed
 *   from the individual statuses in STATUS_ORDER.
 */
export const useActionSummary = (actions: ActionCounts | undefined): ActionSummary => {
  const { t } = useIntl()

  if (!actions) {
    return { total: 0, completed: 0, segments: [], counts: {} }
  }

  const rawByKey: Record<StatusKey, number> = {
    created: countOf(actions.available),
    fixed: countOf(actions.fixed),
    alreadyFixed: countOf(actions.alreadyFixed),
    falsePositive: countOf(actions.falsePositive),
    skipped: countOf(actions.skipped),
    tooHard: countOf(actions.tooHard),
    deleted: countOf(actions.deleted),
    disabled: countOf(actions.disabled),
  }

  const summedTotal = STATUS_ORDER.reduce((acc, key) => acc + rawByKey[key], 0)
  const total = countOf(actions.total) || summedTotal

  const segments: ActionSummarySegment[] = []
  const counts: Partial<Record<StatusKey, number>> = {}

  for (const key of STATUS_ORDER) {
    const count = rawByKey[key]
    if (count <= 0) continue
    counts[key] = count
    segments.push({
      key,
      label: t(`statusBreakdownBar.status.${key}`, undefined, statusLabelByKey[key] ?? key),
      color: statusHexByKey[key] ?? '#71717a',
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    })
  }

  const completed = COMPLETED_STATUS_KEYS.reduce((acc, key) => acc + rawByKey[key], 0)

  return { total, completed, segments, counts }
}
