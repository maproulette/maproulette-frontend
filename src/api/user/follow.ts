import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PublicUser } from '@/types/User'
import { apiRequest } from '../client'

/** Whether a follower is following you or has been blocked from doing so. */
export const FOLLOWER_STATUS = {
  following: 0,
  blocked: 1,
} as const

/** A follower, with the status the backend reports alongside them. */
export interface Follower {
  user: PublicUser
  status: number
}

/**
 * A follower record. The backend wraps the user in a `user` field on the
 * followers list and returns the user directly on the following list, so both
 * shapes are normalised to a plain user here.
 */
const asUser = (entry: unknown): PublicUser => {
  const wrapper = entry as { user?: PublicUser }
  return (wrapper?.user ?? entry) as PublicUser
}

const invalidateFollow = (
  queryClient: ReturnType<typeof useQueryClient>,
  followedUserId: number,
  currentUserId?: number
) => {
  queryClient.invalidateQueries({ queryKey: ['user', followedUserId, 'followers'] })
  if (currentUserId) {
    queryClient.invalidateQueries({ queryKey: ['user', currentUserId, 'following'] })
  }
}

export const userFollow = {
  /** Users this user follows. */
  following: (userId: number, options?: { enabled?: boolean }) =>
    useQuery(
      queryOptions({
        queryKey: ['user', userId, 'following'],
        queryFn: async () => {
          const raw = await apiRequest.get(`api/v2/user/${userId}/following`).json<unknown[]>()
          return (raw ?? []).map(asUser)
        },
        enabled: (options?.enabled ?? true) && !!userId,
      })
    ),

  /**
   * Users following this user, each with their status — a blocked follower is
   * still listed, because you need to see them to unblock them.
   */
  followers: (userId: number, options?: { enabled?: boolean }) =>
    useQuery(
      queryOptions({
        queryKey: ['user', userId, 'followers'],
        queryFn: async () => {
          const raw = await apiRequest.get(`api/v2/user/${userId}/followers`).json<unknown[]>()
          return (raw ?? []).map((entry) => ({
            user: asUser(entry),
            status: (entry as { status?: number })?.status ?? FOLLOWER_STATUS.following,
          })) satisfies Follower[]
        },
        enabled: (options?.enabled ?? true) && !!userId,
      })
    ),

  useFollowUser: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ userId }: { userId: number; currentUserId?: number }) =>
        apiRequest.post(`api/v2/user/${userId}/follow`).text(),
      onSuccess: (_data, { userId, currentUserId }) =>
        invalidateFollow(queryClient, userId, currentUserId),
    })
  },

  /**
   * Stop a follower seeing your activity. They are not told, and still appear
   * to themselves to be following you — they simply stop receiving it.
   */
  useBlockFollower: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ userId }: { userId: number; currentUserId?: number }) =>
        apiRequest.post(`api/v2/user/${userId}/block`).text(),
      onSuccess: (_data, { currentUserId }) => {
        if (currentUserId) {
          queryClient.invalidateQueries({ queryKey: ['user', currentUserId, 'followers'] })
        }
      },
    })
  },

  useUnblockFollower: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ userId }: { userId: number; currentUserId?: number }) =>
        apiRequest.delete(`api/v2/user/${userId}/block`).text(),
      onSuccess: (_data, { currentUserId }) => {
        if (currentUserId) {
          queryClient.invalidateQueries({ queryKey: ['user', currentUserId, 'followers'] })
        }
      },
    })
  },

  useUnfollowUser: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ userId }: { userId: number; currentUserId?: number }) =>
        apiRequest.delete(`api/v2/user/${userId}/follow`).text(),
      onSuccess: (_data, { userId, currentUserId }) =>
        invalidateFollow(queryClient, userId, currentUserId),
    })
  },
}
