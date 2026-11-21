import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../client'

export const challengeLikedOptions = (challengeId: number) =>
  queryOptions({
    queryKey: ['challenge', challengeId, 'isLiked'],
    queryFn: () =>
      apiRequest.get(`api/v2/challenge/${challengeId}/like`).json<{ isLiked: boolean }>(),
    enabled: !!challengeId,
  })

export const challengeLikeCountOptions = (challengeId: number) =>
  queryOptions({
    queryKey: ['challenge', challengeId, 'likeCount'],
    queryFn: () =>
      apiRequest.get(`api/v2/challenge/${challengeId}/likeCount`).json<{ likeCount: number }>(),
    enabled: !!challengeId,
  })

export const useLikeChallenge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challengeId: number) =>
      apiRequest.post(`api/v2/challenge/${challengeId}/like`).json<void>(),
    onSuccess: (_data, challengeId) => {
      queryClient.setQueryData<{ isLiked: boolean }>(['challenge', challengeId, 'isLiked'], {
        isLiked: true,
      })
      queryClient.setQueryData<{ likeCount: number }>(
        ['challenge', challengeId, 'likeCount'],
        (old) => ({ likeCount: (old?.likeCount ?? 0) + 1 })
      )
    },
  })
}

export const useUnlikeChallenge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challengeId: number) =>
      apiRequest.delete(`api/v2/challenge/${challengeId}/like`).json<void>(),
    onSuccess: (_data, challengeId) => {
      queryClient.setQueryData<{ isLiked: boolean }>(['challenge', challengeId, 'isLiked'], {
        isLiked: false,
      })
      queryClient.setQueryData<{ likeCount: number }>(
        ['challenge', challengeId, 'likeCount'],
        (old) => ({ likeCount: Math.max(0, (old?.likeCount ?? 1) - 1) })
      )
    },
  })
}
