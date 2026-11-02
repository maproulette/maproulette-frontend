import { defineMessages, type MessageDescriptor } from 'react-intl'

export const TaskPriority = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const
export type TaskPriorityValue = (typeof TaskPriority)[keyof typeof TaskPriority]

export const PRIORITY_MESSAGES: Record<TaskPriorityValue, MessageDescriptor> = defineMessages({
  0: { id: 'manageChallengeDetail.tasksExplorer.priorityHigh', defaultMessage: 'High' },
  1: { id: 'manageChallengeDetail.tasksExplorer.priorityMedium', defaultMessage: 'Medium' },
  2: { id: 'manageChallengeDetail.tasksExplorer.priorityLow', defaultMessage: 'Low' },
})

/**
 * Colors mirror MR3 `TaskPriorityColors`: red (high), amber (medium), emerald/teal (low).
 * The `hex` keys are used for map layers where Tailwind classes cannot be applied.
 */
export const PRIORITY_COLOR: Record<
  TaskPriorityValue,
  { light: string; dark: string; hex: string; bg: string }
> = {
  0: {
    light: 'bg-red-500',
    dark: 'dark:bg-red-400',
    hex: '#ef4444',
    bg: 'bg-red-500 dark:bg-red-400',
  },
  1: {
    light: 'bg-amber-500',
    dark: 'dark:bg-amber-400',
    hex: '#f59e0b',
    bg: 'bg-amber-500 dark:bg-amber-400',
  },
  2: {
    light: 'bg-emerald-500',
    dark: 'dark:bg-emerald-400',
    hex: '#10b981',
    bg: 'bg-emerald-500 dark:bg-emerald-400',
  },
}

export const PRIORITY_TIERS: readonly TaskPriorityValue[] = [
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
]

export const isTaskPriority = (value: number): value is TaskPriorityValue =>
  (PRIORITY_TIERS as readonly number[]).includes(value)
