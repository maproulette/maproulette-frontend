import { defineMessages } from 'react-intl'
import { STATUS_HEX, STATUS_KEY_TO_ID } from '@/lib/taskConstants'

const hexForKey = (key: string): string => STATUS_HEX[STATUS_KEY_TO_ID[key] ?? -1] ?? '#71717a'

export const statusHexByKey: Record<string, string> = {
  created: hexForKey('created'),
  fixed: hexForKey('fixed'),
  falsePositive: hexForKey('falsePositive'),
  skipped: hexForKey('skipped'),
  deleted: hexForKey('deleted'),
  alreadyFixed: hexForKey('alreadyFixed'),
  tooHard: hexForKey('tooHard'),
  disabled: hexForKey('disabled'),
}

// Labels here intentionally diverge from STATUS_MESSAGES: in the action-breakdown context, "created"
// means "available to work on" rather than the historical "Created" status name.
export const statusMessageByKey = defineMessages({
  created: { id: 'common.available', defaultMessage: 'Available' },
  fixed: { id: 'common.fixed', defaultMessage: 'Fixed' },
  falsePositive: {
    id: 'statusBreakdownBar.status.falsePositive',
    defaultMessage: 'False positive',
  },
  skipped: { id: 'common.skipped', defaultMessage: 'Skipped' },
  deleted: { id: 'common.deleted', defaultMessage: 'Deleted' },
  alreadyFixed: { id: 'statusBreakdownBar.status.alreadyFixed', defaultMessage: 'Already fixed' },
  tooHard: { id: 'common.cantComplete', defaultMessage: "Can't Complete" },
  disabled: { id: 'common.disabled', defaultMessage: 'Disabled' },
})
