import type { components, operations, paths } from './openApiTypes'

/* Responses */
export type UserWhoamiResponse =
  paths['/user/whoami']['get']['responses']['200']['content']['application/json']
export type UserNotificationsResponse =
  paths['/user/{userId}/notifications']['get']['responses']['200']['content']['application/json']

interface UserTaskMetrics {
  total: number
  fixed: number
  falsePositive: number
  alreadyFixed: number
  tooHard: number
  skipped: number
  avgTimeSpent: number
}

export interface UserReviewMetrics {
  total: number
  requested: number
  approved: number
  rejected: number
  assisted: number
  disputed: number
  avgReviewTime: number
}

export interface UserMetricsResponse {
  tasks?: UserTaskMetrics
  reviewTasks?: UserReviewMetrics
  asReviewerTasks?: UserReviewMetrics
}

export type UserSettings = components['schemas']['org.maproulette.framework.model.UserSettings']
export type UserProperties = Record<string, unknown>

/*  Parameters  */
export type UserNotificationsParams =
  operations['notification_retrieves_users_notifications']['parameters']['query']

export type GetAllUsersParams = operations['superadmin_get_all_users']['parameters']['query']

/* Types From API */
export type User = components['schemas']['org.maproulette.framework.model.User']
export type PublicUser = components['schemas']['PublicUser']
export type UserContribution =
  paths['/user/contributions']['get']['responses']['200']['content']['application/json'][number]

// The `/users/find` OSM-username search endpoint returns a flat DTO
// (backend's `UserSearchResult`), not the full `User` shape — it has no
// nested `osmProfile`, just these four fields directly.
export interface UserSearchResult {
  id: number
  osmId: number
  displayName: string
  avatarURL: string
}
