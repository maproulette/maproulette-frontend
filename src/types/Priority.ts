import { defineMessages, type MessageDescriptor } from 'react-intl'

export const TaskPriority = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const
export type TaskPriorityValue = (typeof TaskPriority)[keyof typeof TaskPriority]

export const PRIORITY_MESSAGES: Record<TaskPriorityValue, MessageDescriptor> = defineMessages({
  0: { id: 'manageChallengeDetail.tasksExplorer.priorityHigh', defaultMessage: 'High' },
  1: { id: 'manageChallengeDetail.tasksExplorer.priorityMedium', defaultMessage: 'Medium' },
  2: { id: 'manageChallengeDetail.tasksExplorer.priorityLow', defaultMessage: 'Low' },
})

/** `hex` is the same color as `bg`, for map layers, where classes can't be used. */
export const PRIORITY_COLOR: Record<TaskPriorityValue, { hex: string; bg: string }> = {
  0: { hex: '#fc2842', bg: 'bg-coral-500' },
  1: { hex: '#ff8f00', bg: 'bg-mango-500' },
  2: { hex: '#00abec', bg: 'bg-ocean-500' },
}

export const PRIORITY_TIERS: readonly TaskPriorityValue[] = [
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
]

export const isTaskPriority = (value: number): value is TaskPriorityValue =>
  (PRIORITY_TIERS as readonly number[]).includes(value)
