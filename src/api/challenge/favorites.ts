import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../client'

export const challengeFavorites = {
  isChallengeFavorited: (challengeId: number) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', challengeId, 'isFavorited'],
        queryFn: () =>
          apiRequest
            .get(`api/v2/challenge/${challengeId}/favorite`)
            .json<{ isFavorited: boolean }>(),
        enabled: !!challengeId,
      })
    ),

  useFavoriteChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (challengeId: number) =>
        apiRequest.post(`api/v2/challenge/${challengeId}/favorite`).json<void>(),
      onSuccess: (_data, challengeId) => {
        queryClient.setQueryData<{ isFavorited: boolean }>(
          ['challenge', challengeId, 'isFavorited'],
          { isFavorited: true }
        )
        queryClient.invalidateQueries({ queryKey: ['user'] })
      },
    })
  },

  useUnfavoriteChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (challengeId: number) =>
        apiRequest.delete(`api/v2/challenge/${challengeId}/favorite`).json<void>(),
      onSuccess: (_data, challengeId) => {
        queryClient.setQueryData<{ isFavorited: boolean }>(
          ['challenge', challengeId, 'isFavorited'],
          { isFavorited: false }
        )
        queryClient.invalidateQueries({ queryKey: ['user'] })
      },
    })
  },
}
