export * from './comments'
export * from './explore'
export * from './exports'
export * from './favorites'
export * from './likes'
export * from './reports'

import { challengeSingle } from './single'

export const challenge = {
  ...challengeSingle,
}
