import { challengeComments } from './comments'
import { challengeExplore } from './explore'
import { challengeExports } from './exports'
import { challengeFavorites } from './favorites'
import { challengeLikes } from './likes'
import { challengeReports } from './reports'
import { challengeSingle } from './single'

export const challenge = {
  ...challengeExports,
  ...challengeSingle,
  ...challengeExplore,
  ...challengeFavorites,
  ...challengeLikes,
  ...challengeComments,
  ...challengeReports,
}
