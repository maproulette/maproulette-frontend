import { defineMessages, type MessageDescriptor } from 'react-intl'

export const SORT_FIELDS = [{ value: 'id' }, { value: 'status' }, { value: 'priority' }] as const

export type SortField = (typeof SORT_FIELDS)[number]['value']

export const SORT_FIELD_MESSAGES: Record<SortField, MessageDescriptor> = defineMessages({
  id: { id: 'common.id', defaultMessage: 'ID' },
  status: { id: 'common.status', defaultMessage: 'Status' },
  priority: {
    id: 'common.priority',
    defaultMessage: 'Priority',
  },
})

export const BATCH_SIZE = 50
