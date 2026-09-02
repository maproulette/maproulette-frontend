import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PublicUser } from '@/types/User'
import { apiRequest } from '../client'

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

  /** Users following this user. */
  followers: (userId: number, options?: { enabled?: boolean }) =>
    useQuery(
      queryOptions({
        queryKey: ['user', userId, 'followers'],
        queryFn: async () => {
          const raw = await apiRequest.get(`api/v2/user/${userId}/followers`).json<unknown[]>()
          return (raw ?? []).map(asUser)
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
