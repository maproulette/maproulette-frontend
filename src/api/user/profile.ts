import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Challenge } from '@/types/Challenge'
import type { components } from '@/types/openApiTypes'
import type {
  PublicUser,
  User,
  UserContribution,
  UserMetricsResponse,
  UserProperties,
  UserSettings,
} from '@/types/User'
import { apiRequest } from '../client'
import { userKeys } from './keys'

/**
 * The spec marks `bundledTasks` required, but the API leaves it out entirely
 * for a task that isn't bundled, so it is optional here.
 */
type RawLockedTaskData = components['schemas']['org.maproulette.framework.model.LockedTaskData']
export type LockedTaskData = Omit<RawLockedTaskData, 'bundledTasks'> & {
  bundledTasks?: number[]
}
export type TeamUser = components['schemas']['org.maproulette.framework.model.TeamUser']
export type LeaderboardChallenge =
  components['schemas']['org.maproulette.framework.model.LeaderboardChallenge']

export const publicUserOptions = (userId: number) =>
  queryOptions({
    queryKey: [...userKeys.user(userId), 'public'],
    queryFn: () => apiRequest.get(`api/v2/user/${userId}/public`).json<PublicUser>(),
    enabled: !!userId,
  })

/** The current user's recent contributions. */
export const contributionsOptions = () =>
  queryOptions({
    queryKey: ['user', 'activity'],
    queryFn: () => apiRequest.get('api/v2/user/contributions').json<UserContribution[]>(),
  })

export const userMetricsOptions = (userId: number | undefined, monthDuration = -1) =>
  queryOptions({
    queryKey: ['user', 'metrics', userId, monthDuration],
    queryFn: () =>
      apiRequest
        .get(`api/v2/data/user/${userId}/metrics`, {
          searchParams: {
            monthDuration,
            reviewDuration: monthDuration,
            reviewerDuration: monthDuration,
            start: '',
            end: '',
            reviewStart: '',
            reviewEnd: '',
            reviewerStart: '',
            reviewerEnd: '',
          },
        })
        .json<UserMetricsResponse>(),
    enabled: !!userId,
  })

export const topChallengesOptions = (
  userId: number | undefined,
  { monthDuration = -1, limit = 10, offset = 0 } = {}
) =>
  queryOptions({
    queryKey: [...userKeys.user(userId), 'topChallenges', { monthDuration, limit, offset }],
    queryFn: () =>
      apiRequest
        .get(`api/v2/data/user/${userId}/topChallenges`, {
          searchParams: { monthDuration, limit, offset },
        })
        .json<LeaderboardChallenge[]>(),
    enabled: !!userId,
  })

const savedChallengesKey = (userId: number | undefined) =>
  [...userKeys.user(userId), 'savedChallenges'] as const

export const savedChallengesOptions = (userId: number | undefined, limit = 10, page = 0) =>
  queryOptions({
    queryKey: [...savedChallengesKey(userId), { limit, page }],
    queryFn: () =>
      apiRequest
        .get(`api/v2/user/${userId}/saved`, { searchParams: { limit, page } })
        .json<Challenge[]>(),
    enabled: !!userId,
  })

export const lockedTasksOptions = (userId: number | undefined, limit = 50) =>
  queryOptions({
    queryKey: [...userKeys.lockedTasks(userId), { limit }],
    queryFn: () =>
      apiRequest
        .get(`api/v2/user/${userId}/lockedTasks`, { searchParams: { limit } })
        .json<LockedTaskData[]>(),
    enabled: !!userId,
  })

export const teamMembershipsOptions = (userId: number | undefined) =>
  queryOptions({
    queryKey: userKeys.teamMemberships(userId),
    queryFn: () => apiRequest.get(`api/v2/team/all/user/${userId}/memberships`).json<TeamUser[]>(),
    enabled: !!userId,
  })

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      settings,
      properties,
    }: {
      userId: number
      settings: UserSettings
      properties?: UserProperties
    }) => {
      // `properties` must be sent as a JSON object, not a stringified string: the
      // backend reads it with `(value \ "properties").asOpt[JsObject]` and silently
      // falls back to the stored properties when it isn't an object.
      const payload = {
        ...settings,
        ...(properties && { properties }),
      }
      return apiRequest.put(`api/v2/user/${userId}`, { json: payload }).json<User>()
    },
    // Settings drive UI that should react on click — pinned challenge/project
    // stars in particular — so patch the cached user before the round trip and
    // let `onSuccess` replace it with the server's copy.
    onMutate: ({ settings, properties }) => {
      const previous = queryClient.getQueryData<User>(userKeys.whoami)
      if (!previous) return { previous }
      queryClient.setQueryData<User>(userKeys.whoami, {
        ...previous,
        settings: { ...previous.settings, ...settings },
        ...(properties && { properties }),
      })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<User>(userKeys.whoami, context.previous)
      }
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User>(userKeys.whoami, updatedUser)
    },
  })
}

export const useUnsaveChallenge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, challengeId }: { userId: number; challengeId: number }) =>
      apiRequest.delete(`api/v2/user/${userId}/unsave/${challengeId}`).text(),
    onSuccess: (_data, { userId, challengeId }) => {
      queryClient.setQueryData<{ isFavorited: boolean }>(
        ['challenge', challengeId, 'isFavorited'],
        { isFavorited: false }
      )
      queryClient.invalidateQueries({ queryKey: savedChallengesKey(userId) })
    },
  })
}
