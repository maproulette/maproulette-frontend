import { defineMessages, type MessageDescriptor } from 'react-intl'
import type { TranslateFn } from '@/i18n'

export const STATUS_MESSAGES: Record<number, MessageDescriptor> = defineMessages({
  0: { id: 'common.created', defaultMessage: 'Created' },
  1: { id: 'common.fixed', defaultMessage: 'Fixed' },
  2: { id: 'common.notAnIssue', defaultMessage: 'Not an Issue' },
  3: { id: 'common.skipped', defaultMessage: 'Skipped' },
  4: { id: 'common.deleted', defaultMessage: 'Deleted' },
  5: { id: 'common.alreadyFixed', defaultMessage: 'Already Fixed' },
  6: { id: 'common.cantComplete', defaultMessage: "Can't Complete" },
  7: { id: 'common.answered', defaultMessage: 'Answered' },
  8: { id: 'common.validated', defaultMessage: 'Validated' },
  9: { id: 'common.disabled', defaultMessage: 'Disabled' },
})

/** Translated status label, or undefined for an unrecognized status id. */
export const getStatusLabel = (t: TranslateFn, status: number): string | undefined => {
  const message = STATUS_MESSAGES[status]
  return message ? t(message) : undefined
}

/** Maps string-keyed status names (used by MR3 action counts) to canonical numeric IDs. */
export const STATUS_KEY_TO_ID: Record<string, number> = {
  available: 0,
  created: 0,
  fixed: 1,
  falsePositive: 2,
  skipped: 3,
  deleted: 4,
  alreadyFixed: 5,
  tooHard: 6,
  answered: 7,
  validated: 8,
  disabled: 9,
}

/** Status color as a CSS value, for inline styles (progress bars, charts). */
export const STATUS_COLOR: Record<number, string> = {
  0: 'var(--status-created)',
  1: 'var(--status-fixed)',
  2: 'var(--status-false-positive)',
  3: 'var(--status-skipped)',
  4: 'var(--status-deleted)',
  5: 'var(--status-already-fixed)',
  6: 'var(--status-too-hard)',
  7: 'var(--status-answered)',
  8: 'var(--status-validated)',
  9: 'var(--status-disabled)',
}

/** Solid fill of the status color, for dots and bars. */
export const STATUS_BAR_COLORS: Record<number, string> = {
  0: 'bg-status-created',
  1: 'bg-status-fixed',
  2: 'bg-status-false-positive',
  3: 'bg-status-skipped',
  4: 'bg-status-deleted',
  5: 'bg-status-already-fixed',
  6: 'bg-status-too-hard',
  7: 'bg-status-answered',
  8: 'bg-status-validated',
  9: 'bg-status-disabled',
}

/** Solid status-colored button, for the statuses a mapper can set a task to. */
export const STATUS_BUTTON_COLORS: Record<number, string> = {
  1: 'bg-status-fixed text-steel-950 hover:bg-status-fixed/85',
  2: 'bg-status-false-positive text-steel-950 hover:bg-status-false-positive/85',
  5: 'bg-status-already-fixed text-steel-950 hover:bg-status-already-fixed/85',
  6: 'bg-status-too-hard text-steel-950 hover:bg-status-too-hard/85',
}

/** Soft pill: a tint of the status color behind ordinary text. */
export const STATUS_PILL_COLORS: Record<number, string> = {
  0: 'bg-status-created/15 text-fg ring-status-created/40',
  1: 'bg-status-fixed/15 text-fg ring-status-fixed/40',
  2: 'bg-status-false-positive/15 text-fg ring-status-false-positive/40',
  3: 'bg-status-skipped/15 text-fg ring-status-skipped/40',
  4: 'bg-status-deleted/15 text-fg ring-status-deleted/40',
  5: 'bg-status-already-fixed/15 text-fg ring-status-already-fixed/40',
  6: 'bg-status-too-hard/15 text-fg ring-status-too-hard/40',
  7: 'bg-status-answered/15 text-fg ring-status-answered/40',
  8: 'bg-status-validated/15 text-fg ring-status-validated/40',
  9: 'bg-status-disabled/15 text-fg ring-status-disabled/40',
}

/** Gradient `from-` tint class per status, for activity row backgrounds. */
export const STATUS_TINT_COLORS: Record<number, string> = {
  0: 'from-status-created/15',
  1: 'from-status-fixed/15',
  2: 'from-status-false-positive/15',
  3: 'from-status-skipped/15',
  4: 'from-status-deleted/15',
  5: 'from-status-already-fixed/15',
  6: 'from-status-too-hard/15',
  7: 'from-status-answered/15',
  8: 'from-status-validated/15',
  9: 'from-status-disabled/15',
}

export const tabTriggerClass =
  'gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-3 py-2 data-[state=active]:bg-transparent data-[state=active]:[border-image:var(--accent-gradient)_1] data-[state=active]:text-link dark:data-[state=active]:border-accent dark:data-[state=active]:[border-image:none]'
