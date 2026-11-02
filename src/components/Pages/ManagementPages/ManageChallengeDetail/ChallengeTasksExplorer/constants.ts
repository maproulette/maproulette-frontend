import { defineMessages, type MessageDescriptor } from 'react-intl'

export const TASK_PRIORITY_MESSAGES: Record<number, MessageDescriptor> = defineMessages({
  0: { id: 'manageChallengeDetail.tasksExplorer.priorityHigh', defaultMessage: 'High' },
  1: { id: 'manageChallengeDetail.tasksExplorer.priorityMedium', defaultMessage: 'Medium' },
  2: { id: 'manageChallengeDetail.tasksExplorer.priorityLow', defaultMessage: 'Low' },
})

export const SORT_FIELDS = [{ value: 'id' }, { value: 'status' }, { value: 'priority' }] as const

export type SortField = (typeof SORT_FIELDS)[number]['value']

export const SORT_FIELD_MESSAGES: Record<SortField, MessageDescriptor> = defineMessages({
  id: { id: 'manageChallengeDetail.tasksExplorer.sortFieldId', defaultMessage: 'ID' },
  status: { id: 'manageChallengeDetail.tasksExplorer.sortFieldStatus', defaultMessage: 'Status' },
  priority: {
    id: 'manageChallengeDetail.tasksExplorer.sortFieldPriority',
    defaultMessage: 'Priority',
  },
})

export const BATCH_SIZE = 50
