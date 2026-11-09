import { defineMessages, type MessageDescriptor } from 'react-intl'

export const TASK_STATUS_MESSAGES: Record<number, MessageDescriptor> = defineMessages({
  0: { id: 'common.created', defaultMessage: 'Created' },
  1: { id: 'common.fixed', defaultMessage: 'Fixed' },
  2: { id: 'common.notAnIssue', defaultMessage: 'Not an Issue' },
  3: { id: 'common.skipped', defaultMessage: 'Skipped' },
  4: { id: 'common.deleted', defaultMessage: 'Deleted' },
  5: { id: 'common.alreadyFixed', defaultMessage: 'Already Fixed' },
  6: { id: 'common.cantComplete', defaultMessage: "Can't Complete" },
  9: { id: 'common.disabled', defaultMessage: 'Disabled' },
})

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_MESSAGES).map(([value, label]) => ({
  value: Number(value),
  label,
}))
