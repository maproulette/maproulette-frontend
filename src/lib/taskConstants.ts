import type { TranslateFn } from '@/i18n'

/** English fallback text per status, used as the ICU defaultMessage when a catalog entry is
 *  missing and by non-visible consumers (e.g. STATUS_CONFIG) that don't have access to t(). */
export const STATUS_LABELS: Record<number, string> = {
  0: 'Created',
  1: 'Fixed',
  2: 'Not an Issue',
  3: 'Skipped',
  4: 'Deleted',
  5: 'Already Fixed',
  6: "Can't Complete",
  7: 'Answered',
  8: 'Validated',
  9: 'Disabled',
}

/** Catalog key per status, paired with STATUS_LABELS for translation. */
export const STATUS_LABEL_KEYS: Record<number, string> = {
  0: 'common.created',
  1: 'common.fixed',
  2: 'common.notAnIssue',
  3: 'common.skipped',
  4: 'common.deleted',
  5: 'common.alreadyFixed',
  6: 'common.cantComplete',
  7: 'common.answered',
  8: 'common.validated',
  9: 'common.disabled',
}

/** Translated status label, or undefined for an unrecognized status id. */
export const getStatusLabel = (t: TranslateFn, status: number): string | undefined => {
  const key = STATUS_LABEL_KEYS[status]
  return key ? t(key, undefined, STATUS_LABELS[status]) : undefined
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

/** Canonical Tailwind color token per status. Single source of truth for the status color palette —
 *  every other status-color export below derives from the same hue family. */
export const STATUS_HEX_COLORS: Record<number, string> = {
  0: 'cyan-400',
  1: 'green-500',
  2: 'yellow-400',
  3: 'cyan-400',
  4: 'red-500',
  5: 'orange-400',
  6: 'red-500',
  7: 'purple-500',
  8: 'emerald-500',
  9: 'zinc-500',
}

export const TAILWIND_HEX: Record<string, string> = {
  'cyan-400': '#22d3ee',
  'green-500': '#22c55e',
  'yellow-400': '#facc15',
  'red-500': '#ef4444',
  'orange-400': '#fb923c',
  'purple-500': '#a855f7',
  'emerald-500': '#10b981',
  'zinc-500': '#71717a',
}

export const resolveHex = (twColor: string): string => TAILWIND_HEX[twColor] ?? twColor

/** Resolved hex value per status — derived from STATUS_HEX_COLORS. */
export const STATUS_HEX: Record<number, string> = Object.fromEntries(
  Object.entries(STATUS_HEX_COLORS).map(([id, token]) => [Number(id), resolveHex(token)])
) as Record<number, string>

/** Solid bg Tailwind class per status, used for filled pills with white text. Uses -500 intensity
 *  for legible contrast (same hue family as STATUS_HEX_COLORS). */
export const STATUS_COLORS: Record<number, string> = {
  0: 'bg-cyan-500',
  1: 'bg-green-500',
  2: 'bg-yellow-500',
  3: 'bg-cyan-500',
  4: 'bg-red-500',
  5: 'bg-orange-500',
  6: 'bg-red-500',
  7: 'bg-purple-500',
  8: 'bg-emerald-500',
  9: 'bg-zinc-500',
}

/** Text color class per status, used for colored icons and numerals. */
export const STATUS_TEXT_COLORS: Record<number, string> = {
  0: 'text-cyan-500',
  1: 'text-green-500',
  2: 'text-yellow-500',
  3: 'text-cyan-500',
  4: 'text-red-500',
  5: 'text-orange-500',
  6: 'text-red-500',
  7: 'text-purple-500',
  8: 'text-emerald-500',
  9: 'text-zinc-500',
}

/** Soft pill classes (bg + text + ring, with dark mode) per status — used for inline badges. */
export const STATUS_PILL_COLORS: Record<number, string> = {
  0: 'bg-cyan-100 text-cyan-700 ring-cyan-300/60 dark:bg-cyan-900/40 dark:text-cyan-300 dark:ring-cyan-700/40',
  1: 'bg-green-100 text-green-700 ring-green-300/60 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-700/40',
  2: 'bg-yellow-100 text-yellow-700 ring-yellow-300/60 dark:bg-yellow-900/40 dark:text-yellow-300 dark:ring-yellow-700/40',
  3: 'bg-cyan-100 text-cyan-700 ring-cyan-300/60 dark:bg-cyan-900/40 dark:text-cyan-300 dark:ring-cyan-700/40',
  4: 'bg-red-100 text-red-700 ring-red-300/60 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/40',
  5: 'bg-orange-100 text-orange-700 ring-orange-300/60 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-700/40',
  6: 'bg-red-100 text-red-700 ring-red-300/60 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/40',
  7: 'bg-purple-100 text-purple-700 ring-purple-300/60 dark:bg-purple-900/40 dark:text-purple-300 dark:ring-purple-700/40',
  8: 'bg-emerald-100 text-emerald-700 ring-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/40',
  9: 'bg-zinc-100 text-zinc-500 ring-zinc-300/60 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700/60',
}

/** Left accent bar bg class per status — used for activity rows. */
export const STATUS_BAR_COLORS: Record<number, string> = {
  0: 'bg-cyan-400',
  1: 'bg-green-500',
  2: 'bg-yellow-400',
  3: 'bg-cyan-400',
  4: 'bg-red-500',
  5: 'bg-orange-400',
  6: 'bg-red-500',
  7: 'bg-purple-500',
  8: 'bg-emerald-500',
  9: 'bg-zinc-400',
}

/** Gradient `from-` tint class per status — used for activity row backgrounds. */
export const STATUS_TINT_COLORS: Record<number, string> = {
  0: 'from-cyan-100/70 dark:from-cyan-950/30',
  1: 'from-green-100/70 dark:from-green-950/30',
  2: 'from-yellow-100/70 dark:from-yellow-950/30',
  3: 'from-cyan-100/70 dark:from-cyan-950/30',
  4: 'from-red-100/70 dark:from-red-950/30',
  5: 'from-orange-100/70 dark:from-orange-950/30',
  6: 'from-red-100/70 dark:from-red-950/30',
  7: 'from-purple-100/70 dark:from-purple-950/30',
  8: 'from-emerald-100/70 dark:from-emerald-950/30',
  9: 'from-zinc-100/80 dark:from-zinc-800/30',
}

export const tabTriggerClass =
  'gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-3 py-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-blue-400'
