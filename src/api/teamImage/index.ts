import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TeamImage } from '@/types/TeamImage'
import { apiRequest } from '../client'

// Every mutation touches at least one of these lists, and they overlap (an
// approval moves an image out of the pending queue and into a team's approved
// set), so mutations invalidate the whole namespace rather than trying to
// reason about which individual lists changed.
const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: ['teamImage'] })

export const teamImage = {
  /** Approved images across every team the current user belongs to. */
  available: (enabled = true) =>
    useQuery(
      queryOptions({
        queryKey: ['teamImage', 'available'],
        queryFn: () => apiRequest.get('api/v2/teamImages/available').json<TeamImage[]>(),
        enabled,
      })
    ),

  /** A single team's images, including ones pending review or rejected. */
  forTeam: (teamId: number | undefined) =>
    useQuery(
      queryOptions({
        queryKey: ['teamImage', 'team', teamId],
        queryFn: () => apiRequest.get(`api/v2/team/${teamId}/images`).json<TeamImage[]>(),
        enabled: !!teamId,
      })
    ),

  /** The super admin review queue. */
  pending: (enabled = true) =>
    useQuery(
      queryOptions({
        queryKey: ['teamImage', 'pending'],
        queryFn: () => apiRequest.get('api/v2/teamImages/pending').json<TeamImage[]>(),
        enabled,
      })
    ),

  useRequestImage: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        teamId,
        imageFile,
        name,
      }: {
        teamId: number
        imageFile: File
        name?: string
      }) => {
        const formData = new FormData()
        formData.append('image', imageFile)
        if (name) formData.append('name', name)

        return apiRequest.post(`api/v2/team/${teamId}/image`, { body: formData }).json<TeamImage>()
      },
      onSuccess: () => invalidateAll(queryClient),
    })
  },

  useApproveImage: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ imageId, comment }: { imageId: number; comment?: string }) =>
        apiRequest
          .put(`api/v2/teamImage/${imageId}/approve`, {
            searchParams: comment ? { comment } : undefined,
          })
          .json<TeamImage>(),
      onSuccess: () => invalidateAll(queryClient),
    })
  },

  useRejectImage: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ imageId, comment }: { imageId: number; comment?: string }) =>
        apiRequest
          .put(`api/v2/teamImage/${imageId}/reject`, {
            searchParams: comment ? { comment } : undefined,
          })
          .json<TeamImage>(),
      onSuccess: () => {
        // Rejecting detaches the image from any challenges that were using it.
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
        return invalidateAll(queryClient)
      },
    })
  },

  useDeleteImage: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (imageId: number) =>
        apiRequest.delete(`api/v2/teamImage/${imageId}`).json<void>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
        return invalidateAll(queryClient)
      },
    })
  },
}
