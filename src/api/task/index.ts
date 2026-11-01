import { taskBulk } from './bulk'
import { taskComments } from './comments'
import { taskMultiple } from './multiple'
import { taskSingle } from './single'

export const task = {
  ...taskSingle,
  ...taskMultiple,
  ...taskComments,
  ...taskBulk,
}
