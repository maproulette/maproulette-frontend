import { defineMessages } from 'react-intl'
import { STATUS_COLOR, STATUS_KEY_TO_ID } from '@/lib/taskConstants'

const colorForKey = (key: string): string => STATUS_COLOR[STATUS_KEY_TO_ID[key]]

export const statusColorByKey: Record<string, string> = {
  created: colorForKey('created'),
  fixed: colorForKey('fixed'),
  falsePositive: colorForKey('falsePositive'),
  skipped: colorForKey('skipped'),
  deleted: colorForKey('deleted'),
  alreadyFixed: colorForKey('alreadyFixed'),
  tooHard: colorForKey('tooHard'),
  disabled: colorForKey('disabled'),
}

// Labels here intentionally diverge from STATUS_MESSAGES: in the action-breakdown context, "created"
// means "available to work on" rather than the historical "Created" status name.
export const statusMessageByKey = defineMessages({
  created: { id: 'common.available', defaultMessage: 'Available' },
  fixed: { id: 'common.fixed', defaultMessage: 'Fixed' },
  falsePositive: { id: 'common.notAnIssue', defaultMessage: 'Not an Issue' },
  skipped: { id: 'common.skipped', defaultMessage: 'Skipped' },
  deleted: { id: 'common.deleted', defaultMessage: 'Deleted' },
  alreadyFixed: { id: 'statusBreakdownBar.status.alreadyFixed', defaultMessage: 'Already fixed' },
  tooHard: { id: 'common.cantComplete', defaultMessage: "Can't Complete" },
  disabled: { id: 'common.disabled', defaultMessage: 'Disabled' },
})
