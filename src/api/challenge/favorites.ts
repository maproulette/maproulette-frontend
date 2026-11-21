import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../client'
import { userKeys } from '../user/keys'

export const challengeFavoritedOptions = (challengeId: number) =>
  queryOptions({
    queryKey: ['challenge', challengeId, 'isFavorited'],
    queryFn: () =>
      apiRequest.get(`api/v2/challenge/${challengeId}/favorite`).json<{ isFavorited: boolean }>(),
    enabled: !!challengeId,
  })

export const useFavoriteChallenge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challengeId: number) =>
      apiRequest.post(`api/v2/challenge/${challengeId}/favorite`).json<void>(),
    onSuccess: (_data, challengeId) => {
      queryClient.setQueryData<{ isFavorited: boolean }>(
        ['challenge', challengeId, 'isFavorited'],
        { isFavorited: true }
      )
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export const useUnfavoriteChallenge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challengeId: number) =>
      apiRequest.delete(`api/v2/challenge/${challengeId}/favorite`).json<void>(),
    onSuccess: (_data, challengeId) => {
      queryClient.setQueryData<{ isFavorited: boolean }>(
        ['challenge', challengeId, 'isFavorited'],
        { isFavorited: false }
      )
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
