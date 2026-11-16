import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChallengeReport, ChallengeReportStatusName } from '@/types/ChallengeReport'
import { apiRequest } from '../client'

/**
 * Filing or triaging a report changes both the super admin listing and the
 * per-challenge listing the challenge page reads, so mutations invalidate the
 * whole namespace rather than reasoning about which lists moved.
 */
const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: ['challengeReport'] })

export const challengeReports = {
  /**
   * Every report filed against a challenge, newest first, resolved ones
   * included, as anyone browsing the challenge may see them: the reporter is
   * named, but their contact address and the admin-side triage details are
   * stripped server-side, so a resolved report carries its outcome and nothing
   * more.
   */
  forChallenge: (challengeId: number | undefined, enabled = true) =>
    useQuery(
      queryOptions({
        queryKey: ['challengeReport', 'forChallenge', challengeId],
        queryFn: () =>
          apiRequest.get(`api/v2/challenge/${challengeId}/reports`).json<ChallengeReport[]>(),
        enabled: enabled && !!challengeId,
      })
    ),

  /** The super admin triage listing. */
  reports: ({
    status,
    challengeId,
    activeOnly = false,
    limit = 50,
    page = 0,
    enabled = true,
  }: {
    status?: ChallengeReportStatusName
    challengeId?: number
    activeOnly?: boolean
    limit?: number
    page?: number
    enabled?: boolean
  } = {}) =>
    useQuery(
      queryOptions({
        queryKey: ['challengeReport', 'list', { status, challengeId, activeOnly, limit, page }],
        queryFn: () =>
          apiRequest
            .get('api/v2/challenge/reports', {
              searchParams: {
                ...(status ? { status } : {}),
                ...(challengeId ? { challengeId } : {}),
                activeOnly,
                limit,
                page,
              },
            })
            .json<ChallengeReport[]>(),
        enabled,
        placeholderData: (previousData) => previousData,
      })
    ),

  useReportChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        challengeId,
        comment,
        email,
      }: {
        challengeId: number
        comment: string
        email?: string
      }) =>
        apiRequest
          .post(`api/v2/challenge/${challengeId}/report`, {
            json: { comment, ...(email ? { email } : {}) },
          })
          .json<ChallengeReport>(),
      onSuccess: (_data, variables) => {
        invalidateAll(queryClient)
        // Filing a report also posts a challenge comment server-side, so the
        // challenge's comment lists are now stale.
        queryClient.invalidateQueries({
          queryKey: ['challenge', 'comments', variables.challengeId],
        })
        queryClient.invalidateQueries({
          queryKey: ['challenge', 'taskComments', variables.challengeId],
        })
      },
    })
  },

  useUpdateReportStatus: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        reportId,
        status,
        reviewComment,
      }: {
        reportId: number
        status: ChallengeReportStatusName
        reviewComment?: string
      }) =>
        apiRequest
          .put(`api/v2/challenge/report/${reportId}/status`, {
            json: { status, ...(reviewComment ? { reviewComment } : {}) },
          })
          .json<ChallengeReport>(),
      onSuccess: () => invalidateAll(queryClient),
    })
  },
}
